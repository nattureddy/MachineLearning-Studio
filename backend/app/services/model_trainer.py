import os
import numpy as np
import pandas as pd
import logging
from typing import Dict, Any, Optional, List
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score
from joblib import dump
import joblib
from app.services import storage, evaluation, registry

logger = logging.getLogger(__name__)

# optional imblearn SMOTE
try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except Exception:
    HAS_SMOTE = False


def _match_flags(user_flags: List[str]) -> Dict[str, bool]:
    flags_str = " ".join([str(f).lower() for f in (user_flags or [])])
    return {
        "imputation": "imputation" in flags_str or "handle missing" in flags_str or "handle missing values" in flags_str,
        "standardize": "standardiz" in flags_str or "standardization" in flags_str,
        "normalize": "normaliz" in flags_str or "normalization" in flags_str,
        "pca": "pca" in flags_str,
        "smote": "smote" in flags_str,
        "feature_selection": "feature selection" in flags_str or ("feature" in flags_str and "selection" in flags_str),
        "hyperparameter_tuning": "hyperparameter" in flags_str or "tuning" in flags_str,
        "polynomial": "polynomial" in flags_str,
        "encoding": "encode" in flags_str or "encoding" in flags_str,
        "remove_outliers": "outlier" in flags_str or "remove outliers" in flags_str,
    }


def train_model(task: str, algorithm: str, dataset_filename: str, test_size: float = 0.2,
                improve_with: Optional[list] = None, user_uid: Optional[str] = None) -> Dict[str, Any]:
    improve_with = improve_with or []
    flags = _match_flags(improve_with)
    logger.info("train_model called: task=%s algorithm=%s dataset=%s test_size=%s flags=%s user=%s",
                task, algorithm, dataset_filename, test_size, flags, user_uid)

    # 1. Load dataset via storage helper
    try:
        df = storage.load_dataset(dataset_filename)
        if df is None:
            raise ValueError("storage.load_dataset returned None")
    except Exception as e:
        logger.exception("Failed to load dataset %s: %s", dataset_filename, e)
        raise RuntimeError(f"Failed to load dataset: {e}")

    # Validation
    if df.shape[0] == 0:
        raise RuntimeError("Dataset has no rows.")
    if task in ("regression", "classification") and df.shape[1] < 2:
        raise RuntimeError("Dataset must have at least one feature and a target column.")

    # Default: last column is target for regression/classification
    if task in ("regression", "classification"):
        target_col = df.columns[-1]
        X = df.drop(columns=[target_col])
        y = df[target_col]
    else:
        X = df.copy()
        y = None

    # Encoding: get_dummies for categorical variables
    try:
        X = pd.get_dummies(X, drop_first=True)
    except Exception as e:
        logger.exception("Failed during get_dummies: %s", e)
        raise RuntimeError(f"Failed to encode categorical features: {e}")

    if X.shape[1] == 0:
        raise RuntimeError("No features remain after encoding. Check input dataset and encoding options.")

    # Capture feature names for saving
    features = list(X.columns)

    # Split dataset into train/test (if classification use stratify)
    try:
        if task in ("regression", "classification"):
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42,
                stratify=y if task == "classification" else None
            )
        else:
            X_train = X.copy()
            X_test = None
            y_train = None
            y_test = None
    except Exception as e:
        logger.exception("Train/test split failed: %s", e)
        raise RuntimeError(f"Train/test split failed: {e}")

    pipeline_info = {"applied": []}
    transformers = {}

    # 2. Imputation
    if flags["imputation"]:
        try:
            for col in X_train.columns:
                if X_train[col].dtype.kind in 'biufc':
                    median = X_train[col].median()
                    X_train[col] = X_train[col].fillna(median)
                    X_test[col] = X_test[col].fillna(median) if X_test is not None else X_test
                else:
                    mode_val = X_train[col].mode().iloc[0] if not X_train[col].mode().empty else ""
                    X_train[col] = X_train[col].fillna(mode_val)
                    X_test[col] = X_test[col].fillna(mode_val) if X_test is not None else X_test
            pipeline_info["applied"].append("Imputation")
            transformers["imputation"] = True
        except Exception as e:
            logger.exception("Imputation failed: %s", e)
            raise RuntimeError(f"Imputation failed: {e}")

    # 3. Feature selection (SelectKBest)
    if flags["feature_selection"]:
        try:
            k = min(10, X_train.shape[1])
            if task == "classification":
                selector = SelectKBest(score_func=f_classif, k=k)
            else:
                selector = SelectKBest(score_func=f_regression, k=k)
            selector.fit(X_train.values, y_train.values if y_train is not None else None)
            cols_mask = selector.get_support(indices=True)
            selected_cols = [X_train.columns[i] for i in cols_mask]
            X_train = X_train[selected_cols]
            X_test = X_test[selected_cols] if X_test is not None else X_test
            pipeline_info["applied"].append(f"FeatureSelection(k={k})")
            transformers["feature_selection"] = {"k": k, "cols": selected_cols}
        except Exception as e:
            logger.exception("Feature selection failed: %s", e)
            raise RuntimeError(f"Feature selection failed: {e}")

    # 4. Standardization / Normalization
    if flags["standardize"] or flags["normalize"]:
        try:
            numeric_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) == 0:
                logger.warning("No numeric columns available for scaling.")
            else:
                if flags["standardize"]:
                    scaler = StandardScaler()
                    scaler.fit(X_train[numeric_cols])
                    X_train[numeric_cols] = scaler.transform(X_train[numeric_cols])
                    if X_test is not None:
                        X_test[numeric_cols] = scaler.transform(X_test[numeric_cols])
                    pipeline_info["applied"].append("Standardization")
                    transformers["scaler"] = ("standard", numeric_cols)
                elif flags["normalize"]:
                    scaler = MinMaxScaler()
                    scaler.fit(X_train[numeric_cols])
                    X_train[numeric_cols] = scaler.transform(X_train[numeric_cols])
                    if X_test is not None:
                        X_test[numeric_cols] = scaler.transform(X_test[numeric_cols])
                    pipeline_info["applied"].append("Normalization")
                    transformers["scaler"] = ("minmax", numeric_cols)
        except Exception as e:
            logger.exception("Scaling failed: %s", e)
            raise RuntimeError(f"Scaling failed: {e}")

    # 5. PCA
    if flags["pca"]:
        try:
            num_cols = X_train.select_dtypes(include=[np.number]).shape[1]
            if num_cols <= 1:
                logger.warning("Not enough numeric features for PCA.")
            else:
                pca = PCA(n_components=0.95)
                pca.fit(X_train.select_dtypes(include=[np.number]))
                X_train_pca = pca.transform(X_train.select_dtypes(include=[np.number]))
                X_test_pca = pca.transform(X_test.select_dtypes(include=[np.number])) if X_test is not None else None
                X_train = pd.DataFrame(X_train_pca, index=X_train.index)
                X_test = pd.DataFrame(X_test_pca, index=X_test.index) if X_test is not None else X_test
                pipeline_info["applied"].append("PCA")
                transformers["pca"] = {"n_components": pca.n_components_}
        except Exception as e:
            logger.exception("PCA failed: %s", e)
            raise RuntimeError(f"PCA failed: {e}")

    # 6. Remove outliers
    if flags["remove_outliers"]:
        try:
            num_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
            for c in num_cols:
                q1 = X_train[c].quantile(0.01)
                q99 = X_train[c].quantile(0.99)
                X_train[c] = X_train[c].clip(lower=q1, upper=q99)
                if X_test is not None:
                    X_test[c] = X_test[c].clip(lower=q1, upper=q99)
            pipeline_info["applied"].append("RemoveOutliers(1-99pct)")
            transformers["remove_outliers"] = True
        except Exception as e:
            logger.exception("Remove outliers failed: %s", e)
            raise RuntimeError(f"Remove outliers failed: {e}")

    # 7. Polynomial features not implemented (placeholder)
    if flags["polynomial"]:
        pipeline_info["applied"].append("PolynomialFeatures(not_implemented_placeholder)")

    # 8. Encoding already handled earlier with get_dummies
    if flags["encoding"]:
        pipeline_info["applied"].append("Encoding(already_applied_get_dummies)")

    # 9. SMOTE
    if flags["smote"] and task == "classification":
        if not HAS_SMOTE:
            logger.warning("SMOTE requested but imblearn is not available.")
        else:
            try:
                sm = SMOTE(random_state=42)
                X_train, y_train = sm.fit_resample(X_train, y_train)
                pipeline_info["applied"].append("SMOTE")
                transformers["smote"] = True
            except Exception as e:
                logger.exception("SMOTE failed: %s", e)
                raise RuntimeError(f"SMOTE failed: {e}")

    # 10. Hyperparameter tuning
    do_tuning = flags["hyperparameter_tuning"]
    search_best = None
    if do_tuning:
        try:
            algo_key = algorithm.lower()
            if task == "classification":
                if "random" in algo_key:
                    base = RandomForestClassifier(random_state=42)
                    param_grid = {"n_estimators": [50, 100], "max_depth": [None, 5]}
                elif "logistic" in algo_key:
                    base = LogisticRegression(max_iter=2000, solver="lbfgs")
                    param_grid = {"C": [0.1, 1.0, 10.0]}
                else:
                    base = None; param_grid = {}
                if base is not None:
                    grid = GridSearchCV(base, param_grid, cv=3, scoring="accuracy", n_jobs=1)
                    grid.fit(X_train, y_train)
                    best = grid.best_estimator_
                    logger.info("Hyperparameter tuning: best params %s", grid.best_params_)
                    search_best = best
                    pipeline_info["applied"].append("HyperparameterTuning")
                    transformers["hyperparam"] = {"best_params": grid.best_params_}
            elif task == "regression":
                if "random" in algo_key:
                    base = RandomForestRegressor(random_state=42)
                    param_grid = {"n_estimators": [50, 100], "max_depth": [None, 5]}
                else:
                    base = None; param_grid = {}
                if base is not None:
                    grid = GridSearchCV(base, param_grid, cv=3, scoring="r2", n_jobs=1)
                    grid.fit(X_train, y_train)
                    best = grid.best_estimator_
                    search_best = best
                    pipeline_info["applied"].append("HyperparameterTuning")
                    transformers["hyperparam"] = {"best_params": grid.best_params_}
        except Exception as e:
            logger.exception("Hyperparameter tuning failed: %s", e)
            pipeline_info.setdefault("warnings", []).append(f"Hyperparameter tuning failed: {e}")

    # 11. Create model or use search_best
    algo_key = algorithm.lower().replace(" ", "_")
    model = None
    try:
        if search_best is not None:
            model = search_best
        else:
            if task == "regression":
                if algo_key.startswith("linear"):
                    model = LinearRegression()
                elif "random" in algo_key:
                    model = RandomForestRegressor(n_estimators=100, random_state=42)
                else:
                    model = LinearRegression()
            elif task == "classification":
                if "logistic" in algo_key:
                    model = LogisticRegression(max_iter=2000)
                elif "random" in algo_key:
                    model = RandomForestClassifier(n_estimators=100, random_state=42)
                elif "svm" in algo_key:
                    model = SVC(probability=True)
                elif "knn" in algo_key:
                    model = KNeighborsClassifier()
                else:
                    model = LogisticRegression(max_iter=2000)
            elif task == "clustering":
                if "kmeans" in algo_key or "k-means" in algo_key:
                    model = KMeans(n_clusters=3, random_state=42)
                else:
                    model = KMeans(n_clusters=3, random_state=42)
    except Exception as e:
        logger.exception("Failed to construct model: %s", e)
        raise RuntimeError(f"Failed to initialize model: {e}")

    # 12. Fit model on X_train
    try:
        if task in ("regression", "classification"):
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
        else:
            model.fit(X_train)
            preds = model.predict(X_train) if hasattr(model, "predict") else model.labels_
    except Exception as e:
        logger.exception("Model training failed: %s", e)
        raise RuntimeError(f"Model training failed: {e}")

    # 13. Evaluate
    eval_result = {}
    plots = {}
    try:
        if task == "classification":
            y_prob = None
            if hasattr(model, "predict_proba"):
                try:
                    prob = model.predict_proba(X_test)
                    y_prob = prob[:, 1] if prob.ndim == 2 and prob.shape[1] == 2 else prob
                except Exception:
                    y_prob = None
            eval_result = evaluation.classification_metrics_plots(y_test, preds, y_prob)
            plots = {k: v for k, v in eval_result.items() if k in ("confusion_matrix", "roc_curve")}
        elif task == "regression":
            eval_result = evaluation.regression_metrics_plots(y_test, preds, X_test)
            plots = {"scatter": eval_result.get("scatter")}
        else:
            eval_result = evaluation.clustering_metrics_plots(X_train, preds)
            plots = {}
    except Exception as e:
        logger.exception("Evaluation failed: %s", e)
        eval_result = {"metrics": {}, "error": str(e)}
        plots = {}

    metrics = eval_result.get("metrics", {})

    # 14. Save model and register session
    try:
        safe_model_name = f"{os.path.splitext(os.path.basename(dataset_filename))[0]}_{algorithm.replace(' ','_')}.pkl"
        local_model_path = storage.save_joblib_model(model, safe_model_name, user_uid)
    except Exception as e:
        logger.exception("Failed to save model: %s", e)
        raise RuntimeError(f"Failed to save model: {e}")

    session_meta = {
        "task": task,
        "algorithm": algorithm,
        "dataset": dataset_filename,
        "metrics": metrics,
        "plots": plots,
        "model_local_path": local_model_path,
        "pipeline": pipeline_info,
        "transformers": transformers,
        "created_by": user_uid,
        "features": features,  # Important: store features here
    }
    session_id = registry.create_session(session_meta)

    return {
        "status": "ok",
        "session_id": session_id,
        "metrics": metrics,
        "plots": plots,
        "pipeline": pipeline_info,
        "model_local_path": local_model_path,
    }


def predict_manual(model_filepath: str, inputs: dict):
    # Load the trained model
    model = joblib.load(model_filepath)

    # Convert inputs dict to DataFrame with a single row
    df = pd.DataFrame([inputs])

    # Optionally convert input values to numeric types here
    # for col in df.columns:
    #     df[col] = pd.to_numeric(df[col], errors='ignore')

    # Perform prediction
    preds = model.predict(df)

    # Return a single prediction or a list for multiple predictions
    if len(preds) == 1:
        return preds[0]
    return preds.tolist()


def predict_bulk(model_filepath: str, input_filepath: str):
    # Load the trained model
    model = joblib.load(model_filepath)

    # Load input data from file (assumed csv, can add excel support)
    ext = os.path.splitext(input_filepath)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(input_filepath)
    else:
        df = pd.read_excel(input_filepath, engine="openpyxl")

    # Perform batch predictions
    preds = model.predict(df)

    # Return as list
    return preds.tolist()

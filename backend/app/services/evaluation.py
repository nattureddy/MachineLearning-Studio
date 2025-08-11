# backend/app/services/evaluation.py
import io
import base64
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_curve, auc, confusion_matrix, r2_score, mean_squared_error,
    silhouette_score
)

def _encode_fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    return "data:image/png;base64," + b64


def classification_metrics_plots(y_true, y_pred, y_prob=None, labels=None):
    metrics = {}
    metrics["accuracy"] = float(accuracy_score(y_true, y_pred))
    metrics["precision"] = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    metrics["recall"] = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    metrics["f1"] = float(f1_score(y_true, y_pred, average="macro", zero_division=0))

    result = {"metrics": metrics}

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(4, 3))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    if labels:
        ax.set_xticks(np.arange(len(labels))); ax.set_xticklabels(labels, rotation=45)
        ax.set_yticks(np.arange(len(labels))); ax.set_yticklabels(labels)
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black")
    fig.tight_layout()
    result["confusion_matrix"] = _encode_fig_to_base64(fig)

    # ROC curve (if probabilities available, and binary)
    if y_prob is not None:
        try:
            fpr, tpr, _ = roc_curve(y_true, y_prob)
            roc_auc = auc(fpr, tpr)
            fig, ax = plt.subplots(figsize=(4, 3))
            ax.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")
            ax.plot([0,1],[0,1],"--", color="gray")
            ax.set_xlabel("False Positive Rate")
            ax.set_ylabel("True Positive Rate")
            ax.set_title("ROC Curve")
            ax.legend(loc="lower right")
            result["roc_curve"] = _encode_fig_to_base64(fig)
            result["metrics"]["roc_auc"] = float(roc_auc)
        except Exception:
            pass

    return result


def regression_metrics_plots(y_true, y_pred, X_test=None):
    metrics = {}
    metrics["r2"] = float(r2_score(y_true, y_pred))
    metrics["mse"] = float(mean_squared_error(y_true, y_pred))
    metrics["rmse"] = float(np.sqrt(metrics["mse"]))

    result = {"metrics": metrics}

    # Scatter true vs pred
    fig, ax = plt.subplots(figsize=(4,3))
    ax.scatter(y_true, y_pred, alpha=0.6)
    ax.plot([min(y_true.min(), y_pred.min()), max(y_true.max(), y_pred.max())],
            [min(y_true.min(), y_pred.min()), max(y_true.max(), y_pred.max())],
            color="red", linestyle="--")
    ax.set_xlabel("Actual")
    ax.set_ylabel("Predicted")
    ax.set_title("Actual vs Predicted")
    result["scatter"] = _encode_fig_to_base64(fig)

    return result


def clustering_metrics_plots(X, labels):
    result = {}
    try:
        sil = float(silhouette_score(X, labels))
        result["metrics"] = {"silhouette": sil}
    except Exception:
        result["metrics"] = {}
    return result

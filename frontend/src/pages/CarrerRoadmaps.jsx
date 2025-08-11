/**
 * Machine Learning Career Roadmap
 * --------------------------------
 * This code provides a full, professional, interactive Machine Learning career roadmap component.
 * The code is heavily commented and uses a modular structure.
 * Each stage is visually separated: Connectors (timeline), TopicCards, topic icons, etc.
 * The main roadmap heading is outside the content card.
 * Visuals work best with Tailwind CSS but are easy to adapt.
 *
 * Features:
 * - Logical grouping: Foundations, Core ML, Deep Learning, Advanced topics, Real-world/Portfolio, Resources.
 * - Each section is rendered by a dedicated sub-component.
 * - Timeline vertical connector visually separates stages.
 * - Each topic inside the section is a stylized item, with optional icon.
 * - External links are clear, new-tab, and styled.
 * - Each section has commentary and inline tips.
 * - Main heading is outside the "card" (per your request).
 * - You can easily add more sections or customize.
 */

import React from "react";

// You can swap these for your favorite icon library
import {
  BookOpen,
  Cpu,
  Activity,
  Layers,
  Code,
  GitBranch,
  Users,
  Settings,
  SquareStack,
  Aperture,
  Brain,
  Code2,
  FlaskConical,
  GitCommitHorizontal,
  Star,
  Trophy,
  Globe,
  Library,
  School,
  FolderGit2,
} from "lucide-react";

/**
 * Card container for a roadmap stage.
 * Children: The section content.
 * icon: Large icon for the stage.
 * heading: The topic heading (e.g. "Foundations").
 * id: Unique anchor for scrolling (optional).
 */
const TopicCard = ({ icon, heading, children, id }) => (
  <section
    id={id}
    className="relative mb-14 md:mb-24"
    aria-labelledby={heading}
    tabIndex={-1}
  >
    <div className="flex items-center">
      <div className="-ml-2">
        <span className="inline-flex items-center justify-center rounded-full bg-white text-blue-700 w-14 h-14 shadow-md ring-4 ring-blue-200 border border-blue-300">
          {icon}
        </span>
      </div>
      <h2
        className="ml-4 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight drop-shadow-sm"
        id={heading.replace(" ", "-")}
      >
        {heading}
      </h2>
    </div>
    {/* Card body */}
    <div className="mt-4 bg-white rounded-lg shadow-xl border border-gray-200 py-6 px-6 md:px-10">
      {children}
    </div>
  </section>
);

/**
 * Renders a visually connecting vertical line between topics
 * (can be customized as dashed, color, etc).
 */
const Connector = () => (
  <div className="flex flex-col items-center">
    <div className="h-12 md:h-20 border-l-4 border-blue-200 ml-7"></div>
  </div>
);

/**
 * Render an individual roadmap topic.
 * Props: text (string), icon (icon component).
 */
const TopicItem = ({ icon, text, children }) => (
  <li className="flex items-start gap-4 py-3 md:py-4">
    <span className="flex-shrink-0 mt-1 text-blue-500">
      {icon}
    </span>
    <span>
      <span className="font-semibold text-base md:text-lg">{text}</span>
      <br />
      {children}
    </span>
  </li>
);

/**
 * Main roadmap component
 * (do not move main heading into the card: per user request)
 * The underlying data structure, steps, and display logic are fully explained.
 */
const CareerRoadMap = () => {
  return (
    <div className="w-full min-h-screen pb-12 md:pb-24 bg-gray-50 flex flex-col items-center">
      {/*=============================*/}
      {/* ROADMAP PAGE MAIN HEADING   */}
      {/*=============================*/}
      <header className="pt-14 pb-8 md:pt-20 md:pb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 drop-shadow-sm mb-3">
          Machine Learning Career Roadmap
        </h1>
        <p className="text-lg md:text-xl mb-2 text-gray-700 max-w-2xl mx-auto font-semibold">
          Your step-by-step guide to mastering Machine Learning from beginner to professional.
        </p>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto font-normal">
          This roadmap covers all skills, tools, and experiences you need—no matter your background—along with actionable tracks, tips, and resource links for every step.
        </p>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 md:px-8">
        {/*=============================*/}
        {/* 1. Programming & Math       */}
        {/*=============================*/}
        <TopicCard
          id="foundation"
          icon={<Code size={32} />}
          heading="1. Foundations: Programming & Math"
        >
          <ul className="space-y-2">
            <TopicItem icon={<BookOpen size={20} />} text="Learn Python basics">
              <span className="text-gray-800">
                Focus on syntax, variables, functions, data structures (lists, dicts), OOP, and script organization. <br />
                <a
                  href="https://docs.python.org/3/tutorial/"
                  className="text-blue-600 underline"
                  target="_blank" rel="noreferrer"
                >
                  Official Python Tutorial
                </a>
              </span>
            </TopicItem>
            <TopicItem icon={<Cpu size={20} />} text="Master Mathematics for ML">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li>Linear Algebra: Vectors, matrices, matrix multiplication</li>
                <li>Calculus: Derivatives, gradients, chain rule</li>
                <li>Probability &amp; Statistics: Distributions, mean/variance, hypothesis testing</li>
                <li><a href="https://www.khanacademy.org/math/linear-algebra" className="text-blue-600 underline" target="_blank" rel="noreferrer">Khan Academy: Linear Algebra</a></li>
              </ul>
            </TopicItem>
            <TopicItem icon={<Layers size={20} />} text="Get comfortable with Data Handling">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li><b>NumPy:</b> Arrays, vectorized operations, reshaping, broadcasting</li>
                <li><b>Pandas:</b> Reading CSV, dataframes, filtering, grouping, merging</li>
                <li><b>Data Visualization:</b> <a href="https://seaborn.pydata.org/tutorial.html" className="text-blue-600 underline" target="_blank" rel="noreferrer">Seaborn</a>, Matplotlib</li>
              </ul>
            </TopicItem>
            <TopicItem icon={<Activity size={20} />} text="Mathematics in Practice">
              <span>
                <b>Tip:</b> Try to code out matrix multiplication, regression loss calculations, or simple visualizations using <code className="bg-gray-100 rounded px-1 mx-1">matplotlib</code> as a project.
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 2. Core ML Concepts         */}
        {/*=============================*/}
        <TopicCard
          id="basics"
          icon={<FlaskConical size={32} />}
          heading="2. Core Machine Learning Concepts"
        >
          <ul className="space-y-2">
            <TopicItem icon={<SquareStack size={20} />} text="Supervised Learning Algorithms">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li>Regression: Linear, Logistic regression</li>
                <li>Classification: KNN, Decision Trees, SVM, Naive Bayes</li>
                <li>How to tune parameters, understand assumptions</li>
              </ul>
            </TopicItem>
            <TopicItem icon={<Layers size={20} />} text="Unsupervised Learning">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li>Clustering: K-Means, Hierarchical clustering</li>
                <li>Dimensionality reduction: PCA, t-SNE</li>
                <li>Discovering patterns without labels</li>
              </ul>
            </TopicItem>
            <TopicItem icon={<GitBranch size={20} />} text="Model Evaluation & Validation">
              <span>
                Learn about train-test splits, cross-validation, <b>bias-variance tradeoff</b>, <b>regularization</b> (L1/L2), and <b>metrics:</b>
                <ul className="list-disc list-inside pl-2">
                  <li>Accuracy, precision, recall, F1-score</li>
                  <li>ROC-AUC, confusion matrix</li>
                </ul>
              </span>
            </TopicItem>
            <TopicItem icon={<Settings size={20} />} text="Feature Engineering & Selection">
              <span>
                Deal with missing data, categorical encoding (OneHot, Label encoding),
                scaling/normalization, and feature importance.
                <br /><b>Library to explore:</b> <span className="italic">scikit-learn</span>
              </span>
            </TopicItem>
            <TopicItem icon={<Code2 size={20} />} text="Building Projects">
              <span>
                <b>Tip:</b> Experiment with <b>Jupyter Notebooks</b> for prototyping, data analysis, and sharing work.
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 3. Practical ML & Tooling   */}
        {/*=============================*/}
        <TopicCard
          id="practical"
          icon={<Aperture size={32} />}
          heading="3. Practical ML: Libraries & Tools"
        >
          <ul className="space-y-2">
            <TopicItem icon={<School size={20} />} text="scikit-learn Essentials">
              <span>
                Implement basic ML algorithms, set up preprocessing pipelines, practice grid/random search for model tuning.
                <br />
                <a href="https://scikit-learn.org/stable/tutorial/index.html" className="text-blue-600 underline" target="_blank" rel="noreferrer">scikit-learn Tutorials</a>
              </span>
            </TopicItem>
            <TopicItem icon={<FolderGit2 size={20} />} text="Version Control & Collaboration">
              <span>
                Use <b>Git</b> and <b>GitHub</b> for source code tracking, sharing, and collaborating.
              </span>
            </TopicItem>
            <TopicItem icon={<Library size={20} />} text="Experiment Tracking">
              <span>
                Track experiments with <b>MLflow, Weights & Biases, Neptune.ai</b>.
              </span>
            </TopicItem>
            <TopicItem icon={<School size={20} />} text="Jupyter Notebooks for Experimentation">
              <span>
                Notebook best practices: reproducibility, visualization, markdown.
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 4. Deep Learning Essentials */}
        {/*=============================*/}
        <TopicCard
          id="deeplearning"
          icon={<Brain size={32} />}
          heading="4. Deep Learning Fundamentals"
        >
          <ul className="space-y-2">
            <TopicItem icon={<Cpu size={20} />} text="Neural Network Basics">
              <span>
                Understand perceptrons, feedforward, MLPs, activation functions, and loss/cost functions.
              </span>
            </TopicItem>
            <TopicItem icon={<Layers size={20} />} text="Intro to Frameworks: PyTorch &amp; TensorFlow">
              <span>
                Learn the core API: tensor operations, building simple models.<br />
                <a href="https://pytorch.org/tutorials/" className="text-blue-600 underline" target="_blank" rel="noreferrer">PyTorch Tutorials</a>
                {" | "}
                <a href="https://www.tensorflow.org/tutorials" className="text-blue-600 underline" target="_blank" rel="noreferrer">TensorFlow Tutorials</a>
              </span>
            </TopicItem>
            <TopicItem icon={<Aperture size={20} />} text="Training Techniques">
              <span>
                Learn backpropagation, optimizers (SGD, Adam), how to debug training, and techniques (batch norm, dropout, early stopping).
              </span>
            </TopicItem>
            <TopicItem icon={<Aperture size={20} />} text="CNNs & Computer Vision">
              <span>
                Study convolutions, pooling, ResNets, data augmentation, and use datasets like CIFAR, MNIST.
              </span>
            </TopicItem>
            <TopicItem icon={<Aperture size={20} />} text="RNNs, LSTM, Transformers">
              <span>
                For text and sequence data: start with RNNs/LSTMs, then move to attention and transformer models.
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 5. Advanced Topics & Specializations */}
        {/*=============================*/}
        <TopicCard
          id="advanced"
          icon={<BookOpen size={32} />}
          heading="5. Advanced Topics & Specializations"
        >
          <ul className="space-y-2">
            <TopicItem icon={<Code2 size={20} />} text="Natural Language Processing (NLP)">
              <span>
                Text vectorization, embeddings (word2vec, GloVe), transformers (BERT, GPT).
                <br />
                <a href="https://huggingface.co/course/chapter1" className="text-blue-600 underline" target="_blank" rel="noreferrer">Hugging Face Transformer Guide</a>
              </span>
            </TopicItem>
            <TopicItem icon={<Aperture size={20} />} text="Computer Vision">
              <span>
                Object detection (YOLO, RCNN), image segmentation, OpenCV basics.
              </span>
            </TopicItem>
            <TopicItem icon={<Star size={20} />} text="Reinforcement Learning / RL">
              <span>
                Understand Markov Decision Processes (MDP), Q-learning, policy gradients.
              </span>
            </TopicItem>
            <TopicItem icon={<Activity size={20} />} text="Generative Models">
              <span>
                GANs (Generative Adversarial Networks), VAEs (Variational Autoencoders).
              </span>
            </TopicItem>
            <TopicItem icon={<Settings size={20} />} text="Responsible AI, Ethics & Fairness">
              <span>
                Study bias, interpretability, explainability (SHAP, LIME).
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 6. Real-World Practice & Portfolio */}
        {/*=============================*/}
        <TopicCard
          id="projects"
          icon={<GitCommitHorizontal size={32} />}
          heading="6. Projects & Real-World Experience"
        >
          <ul className="space-y-2">
            <TopicItem icon={<Globe size={20} />} text="Build End-to-end Projects">
              <span>
                Ingest data, preprocess, perform EDA, model/train/evaluate, and <b>deploy</b> your solution (Flask, Streamlit, Gradio; or cloud).
              </span>
            </TopicItem>
            <TopicItem icon={<Users size={20} />} text="Kaggle & ML Competitions">
              <span>
                Practice with real data, learn from notebooks, understand evaluation, and benchmark progress.
                <br />
                <a href="https://kaggle.com" className="text-blue-600 underline" target="_blank" rel="noreferrer">Kaggle Competitions</a>
              </span>
            </TopicItem>
            <TopicItem icon={<GitBranch size={20} />} text="Open Source & Research">
              <span>
                Contribute to ML open-source repos, read/reproduce research papers.
                <br />
                <a href="https://paperswithcode.com/" className="text-blue-600 underline" target="_blank" rel="noreferrer">Papers With Code</a>
              </span>
            </TopicItem>
            <TopicItem icon={<Trophy size={20} />} text="Portfolio & Presentation">
              <span>
                Publish your code on GitHub, create a simple portfolio web page or blog, write project READMEs.
              </span>
            </TopicItem>
          </ul>
        </TopicCard>
        <Connector />

        {/*=============================*/}
        {/* 7. Resources & Communities  */}
        {/*=============================*/}
        <TopicCard
          id="resources"
          icon={<Library size={32} />}
          heading="7. Learning Resources & Communities"
        >
          <ul className="space-y-2">
            <TopicItem icon={<BookOpen size={20} />} text="Courses">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li>
                  <a
                    href="https://www.coursera.org/learn/machine-learning"
                    className="text-blue-600 underline"
                    target="_blank" rel="noreferrer"
                  >
                    [Coursera] Machine Learning by Andrew Ng
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.fast.ai/"
                    className="text-blue-600 underline"
                    target="_blank" rel="noreferrer"
                  >
                    [fast.ai] Practical Deep Learning
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.udacity.com/course/intro-to-machine-learning-with-pytorch--ud188"
                    className="text-blue-600 underline"
                    target="_blank" rel="noreferrer"
                  >
                    [Udacity] ML Nanodegree
                  </a>
                </li>
              </ul>
            </TopicItem>
            <TopicItem icon={<FolderGit2 size={20} />} text="Tutorials & Docs">
              <ul className="list-disc list-inside pl-2 text-gray-900">
                <li>
                  <a href="https://scikit-learn.org/stable/tutorial/index.html" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    scikit-learn Tutorials
                  </a>
                  {" | "}
                  <a href="https://pytorch.org/tutorials/" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    PyTorch Tutorials
                  </a>
                  {" | "}
                  <a href="https://www.tensorflow.org/tutorials" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    TensorFlow Tutorials
                  </a>
                </li>
              </ul>
            </TopicItem>
            <TopicItem icon={<Users size={20} />} text="Communities & Forums">
              <span>
                <a href="https://www.kaggle.com/discussion" className="text-blue-600 underline" target="_blank" rel="noreferrer">Kaggle Forums</a>,{" "}
                <a href="https://discuss.pytorch.org/" className="text-blue-600 underline" target="_blank" rel="noreferrer">PyTorch Forum</a>,{" "}
                <a href="https://stackoverflow.com/questions/tagged/machine-learning" className="text-blue-600 underline" target="_blank" rel="noreferrer">Stack Overflow</a>
              </span>
            </TopicItem>
            <TopicItem icon={<BookOpen size={20} />} text="Books">
              <span>
                <a href="https://www.deeplearningbook.org/" className="text-blue-600 underline" target="_blank" rel="noreferrer">Deep Learning (Goodfellow et al.)</a><br />
                <a href="https://www.patterns.dev/posts/classical-ml/" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                  Hands-On ML (Aurelien Geron)
                </a>
              </span>
            </TopicItem>
          </ul>
        </TopicCard>

        {/* Page navigation: "Jump to" index */}
        <nav className="w-full max-w-2xl mx-auto my-10 flex flex-wrap justify-center gap-4 px-2">
          {[
            { label: "Foundation", id: "foundation" },
            { label: "Core ML", id: "basics" },
            { label: "Practical ML", id: "practical" },
            { label: "Deep Learning", id: "deeplearning" },
            { label: "Advanced", id: "advanced" },
            { label: "Projects", id: "projects" },
            { label: "Resources", id: "resources" },
          ].map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              className="px-4 py-2 bg-blue-100 rounded-lg font-bold text-blue-700 transition hover:bg-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
              aria-label={`Jump to ${label}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </main>

      {/* Page end/fading connection */}
      <div className="mt-14 opacity-70 select-none text-center text-blue-500 text-sm pb-4">
        🛣️ End of Roadmap — <span className="italic">Explore, learn, repeat!</span>
      </div>

      {/* Custom scrollbar style */}
      <style>{`
        ::selection { background: #a3caff44 !important;}
        html, body, #root { background: #f9fcff; }
        ::-webkit-scrollbar {width: 7px;}
        ::-webkit-scrollbar-thumb {background: #b3cdf6; border-radius: 7px;}
      `}</style>
    </div>
  );
};

export default CareerRoadMap;
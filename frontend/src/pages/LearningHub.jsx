import React from 'react';
import Foundations from '../learning/Foundations';
import DataPreparation from '../learning/DataPreparation';
import SupervisedLearning from '../learning/SupervisedLearning';
import Classification from '../learning/Classification';
import ModelEvaluation from '../learning/ModelEvaluation';
import UnsupervisedLearning from '../learning/UnsupervisedLearning';
import FeatureEngineering from '../learning/FeatureEngineering';
import AdvancedTopics from '../learning/AdvancedTopics';
import NeuralNetworks from '../learning/NeuralNetworks'
import EndToEndWorkflow from '../learning/EndToEndWorkflow'
import RealWorldProjects from '../learning/RealWorldProjects'

const topics = [
  { id: 'foundations', name: 'Foundations' },
  { id: 'data-preparation', name: 'Data Preparation' },
  { id: 'supervised-learning', name: 'Supervised Learning' },
  { id: 'classification', name: 'Classification' },
  { id: 'model-evaluation', name: 'Model Evaluation' },
  { id: 'unsupervised-learning', name: 'Unsupervised Learning' },
  { id: 'feature-engineering', name: 'Feature Engineering' },
  { id: 'advanced-topics', name: 'Advanced Topics' },
  { id: 'neural-networks', name: 'Neural Networks' },
  { id: 'end-to-end-workflow', name: 'End-to-End Workflow' },
  { id: 'real-world-projects', name: 'Real World Projects' },
];

const LearningHub = () => {
  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <header className="mb-8">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
          Learning Hub
        </h1>
        <p className="text-xl text-gray-700">
          Watch video lectures, mark your progress, and master ML step by step.
        </p>
      </header>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-10 bg-gray-50 bg-opacity-90 backdrop-blur-sm shadow-sm py-4 mb-8 rounded-lg border border-gray-200">
        <ul className="flex flex-wrap gap-2 px-4 justify-center">
          {topics.map((topic) => (
            <li key={topic.id}>
              <a
                href={`#${topic.id}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                {topic.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Render topic components with IDs */}
      <div className="space-y-12">
        <Foundations id="foundations" />
        <DataPreparation id="data-preparation" />
        <SupervisedLearning id="supervised-learning" />
        <Classification id="classification" />
        <ModelEvaluation id="model-evaluation" />
        <UnsupervisedLearning id="unsupervised-learning" />
        <FeatureEngineering id="feature-engineering" />
        <AdvancedTopics id="advanced-topics" />
        <NeuralNetworks id="neural-networks" />
        <EndToEndWorkflow id="end-to-end-workflow" />
        <RealWorldProjects id="real-world-projects" />
      </div>
    </div>
  );
};

export default LearningHub;
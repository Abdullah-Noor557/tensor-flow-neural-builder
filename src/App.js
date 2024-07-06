import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import './App.css';

const CompilationSettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="compilation-settings">
      <h4>Compilation</h4>
      <div>
        <label htmlFor="optimizer">Optimizer:</label>
        <span></span>
        <select
          id="optimizer"
          name="optimizer"
          value={settings.optimizer}
          onChange={onSettingsChange}
        >
          <option value="adam">Adam</option>

          <option value="sgd">SGD</option>
          <option value="rmsprop">RMSprop</option>
        </select>
      </div>
      <hr></hr>

      <div>
        <label htmlFor="loss">Loss:</label>
        <select
          id="loss"
          name="loss"
          value={settings.loss}
          onChange={onSettingsChange}
        >
          <option value="sparse_categorical_crossentropy">Sparse Categorical Crossentropy</option>
          <option value="binary_crossentropy">Binary Crossentropy</option>
          <option value="mse">Mean Squared Error</option>
        </select>
      </div>
      <hr></hr>

      <div>
        <label htmlFor="metrics">Metrics:</label>
        <select
          id="metrics"
          name="metrics"
          value={settings.metrics}
          onChange={onSettingsChange}
          multiple
        >
          <option value="accuracy">Accuracy</option>
          <option value="precision">Precision</option>
          <option value="recall">Recall</option>
        </select>
      </div>
    </div>
  );
};
const CustomNode = ({ data, isConnectable, selected, id }) => {

  const { setNodes } = useReactFlow();


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              [name]: value,
            },
          };
        }
        return node;
      })
    );
  };

  const renderInput = (key, value) => {
    if (key === 'activation') {
      return (
        <select
          id={`${key}-${id}`}
          name={key}
          value={value}
          onChange={handleInputChange}
          className="node-input"
        >
          {activationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        id={`${key}-${id}`}
        name={key}
        value={value}
        onChange={handleInputChange}
        className="node-input"
      />
    );
  };

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      {data.label !== 'Input' && (
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="handle handle-left" />
      )}
      <div className="node-content">
        <span className="node-label">{data.label}</span>
        <div className="line"></div>
        {data.label !== 'Input' && (
          <>
            {Object.entries(data).map(([key, value]) => {
              if (key !== 'label') {
                return (
                  <div key={key} className="node-info">
                    <label htmlFor={`${key}-${id}`}>{key}:</label>
                    {renderInput(key, value)}
                  </div>
                );
              }
              return null;
            })}
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="handle handle-right" />
      {data.label !== 'Input' && (
        <div className="delete-button">
          ×
        </div>
      )}
    </div>
  );
};
const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
}) => {
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 100} ${sourceY} ${targetX - 100} ${targetY} ${targetX} ${targetY}`;

  return (
    <motion.path
      id={id}
      style={style}
      className="animated-edge"
      d={edgePath}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      fill="none"
    />
  );
};

const initialNodes = [
  { id: '1', position: { x: 0, y: 150 }, data: { label: 'Input', shape: '(None, 28, 28, 1)' }, type: 'custom' },
];

const initialEdges = [];

const layerTypes = [
  'Dense',
  'Conv2D',
  'MaxPooling2D',
  'Flatten',
  'Dropout',
];
const activationOptions = ['relu', 'sigmoid', 'tanh', 'softmax', 'linear'];

const nodeTypes = {
  custom: (props) => <CustomNode {...props} id={props.id} activationOptions={activationOptions} />,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const [compilationSettings, setCompilationSettings] = useState({
    optimizer: 'adam',
    loss: 'tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)',
    metrics: ['accuracy'],
  });

  const handleCompilationSettingsChange = (e) => {
    const { name, value } = e.target;
    setCompilationSettings(prev => ({
      ...prev,
      [name]: name === 'metrics' ? Array.from(e.target.selectedOptions, option => option.value) : value,
    }));
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'animated' }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }))
    );
  }, [setNodes]);



  const addNode = useCallback((layerType) => {
    const newNodeId = (nodes.length + 1).toString();
    let xPosition = nodes.length > 2 ? nodes.length * 350 : nodes.length * 320;

    let nodeData = { label: layerType };

    switch (layerType) {
      case 'Dense':
        nodeData = {
          ...nodeData,
          units: '64',
          activation: 'relu',
        };
        break;
      case 'Conv2D':
        nodeData = {
          ...nodeData,
          filters: '32',
          kernel_size: '3',
          strides: '1',
          padding: 'valid',
          activation: 'relu',
        };
        break;
      case 'MaxPooling2D':
        nodeData = {
          ...nodeData,
          pool_size: '2',
          strides: '2',
          padding: 'valid',
        };
        break;
      case 'Flatten':
        // Flatten doesn't require additional parameters
        break;
      case 'Dropout':
        nodeData = {
          ...nodeData,
          rate: '0.5',
        };
        break;
      default:
        break;
    }

    const newNode = {
      id: newNodeId,
      type: 'custom',
      data: nodeData,
      position: { x: xPosition, y: 150 },
    };

    const newEdge = {
      id: `e${nodes.length}-${newNodeId}`,
      source: nodes[nodes.length - 1].id,
      target: newNodeId,
      type: 'animated',
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 50);
  }, [nodes, setNodes, setEdges, fitView]);

  const generateTensorFlowCode = useCallback(() => {
    let code = 'import tensorflow as tf\n\n';
    code += 'model = tf.keras.Sequential()\n\n';

    nodes.forEach(node => {
      if (node.data.label !== 'Input') {
        switch (node.data.label) {
          case 'Dense':
            code += `model.add(tf.keras.layers.Dense(units=${node.data.units}, activation='${node.data.activation}'))\n`;
            break;
          case 'Conv2D':
            code += `model.add(tf.keras.layers.Conv2D(filters=${node.data.filters}, kernel_size=${node.data.kernel_size}, strides=${node.data.strides}, padding='${node.data.padding}', activation='${node.data.activation}'))\n`;
            break;
          case 'MaxPooling2D':
            code += `model.add(tf.keras.layers.MaxPooling2D(pool_size=${node.data.pool_size}, strides=${node.data.strides}, padding='${node.data.padding}'))\n`;
            break;
          case 'Flatten':
            code += `model.add(tf.keras.layers.Flatten())\n`;
            break;
          case 'Dropout':
            code += `model.add(tf.keras.layers.Dropout(rate=${node.data.rate}))\n`;
            break;
          default:
            break;
        }
      }
    });


    // Add compilation step
    code += '\n# Compile the model\n';
    code += `model.compile(optimizer='${compilationSettings.optimizer}',\n`;
    code += `              loss=${compilationSettings.loss},\n`;
    code += `              metrics=${JSON.stringify(compilationSettings.metrics)})\n`;

    return code;
  }, [nodes, edges, compilationSettings]);

  const copyToClipboard = useCallback(() => {
    const code = generateTensorFlowCode();

    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy code: ', err);
      alert('Failed to copy code. Please try again.');
    });
  }, [generateTensorFlowCode]);

  function downloadFile(code) {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'tensorflow_model.py';
    document.body.appendChild(element); // Required for this to work in Firefox
    element.click();
  }

  return (
    <div className="app-container dark-mode">
      <div className="sidebar">
        <h1 className="sidebar-mainTitle"> TF Neural Net Builder </h1>
        <h3 className="sidebar-title">Layers</h3>
        <div className="button-container">
          {layerTypes.map((layerType) => (
            <button
              key={layerType}
              onClick={() => addNode(layerType)}
              className="add-layer-button"
            >
              {layerType}
            </button>
          ))}
          <CompilationSettings
            settings={compilationSettings}
            onSettingsChange={handleCompilationSettingsChange}
          />
          <button onClick={copyToClipboard} className="get-code-button">
            Copy Python Code
          </button>

        </div>
      </div>
      <div className="reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background size={2} color="#4a5568" variant={BackgroundVariant.Dots} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

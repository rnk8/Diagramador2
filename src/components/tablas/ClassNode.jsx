import React from 'react';
import { Handle, Position } from '@xyflow/react';
import './classNode.css';

function ClassNode({ data, isConnectable }) {
  return (
    <div className="class-node">
      {/* Handle de entrada para conexiones */}
      <Handle
  type="source"
  position={Position.Right}
  id="right"
  isConnectable={isConnectable}
  className="handle"
/>
      
      {/* Nombre de la clase */}
      <div className="class-name">
        <strong>{data.className}</strong>
      </div>

      {/* Sección de atributos */}
      <div className="class-attributes">
        <h4>Atributos:</h4>
        <ul>
          {data.attributes.map((attr, index) => (
            <li key={index}>{attr}</li>
          ))}
        </ul>
      </div>

      {/* Sección de métodos */}
      <div className="class-methods">
        <h4>Métodos:</h4>
        <ul>
          {data.methods.map((method, index) => (
            <li key={index}>{method}</li>
          ))}
        </ul>
      </div>

      {/* Handle de salida para conexiones */}
   
<Handle
  type="target"
  position={Position.Left}
  id="left"
  isConnectable={isConnectable}
  className="handle"
/>
    </div>
  );
}

export default ClassNode;

import React from "react";
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from "@xyflow/react";
import './customEdgeStartEnd.css';

// Componente para las etiquetas de las aristas (edges)
function EdgeLabel({ transform, label }) {
  return (
    <div style={{ transform }} className="edge-label nodrag nopan">
      {label}
    </div>
  );
}

// Marcador de triángulo vacío para Generalización (herencia)
const TriangleArrow= () => (
  <marker
    id="triangle"
    markerWidth="50" markerHeight="50" refX="5" refY="5" orient="auto"
  >
     <path d="M 0 0 L 10 5 L 0 10 z" fill="#B7B7B7FF"  />
  </marker>
);


// Marcador de rombo vacío para Agregación
const DiamondEmpty = () => (
  <marker
    id="diamondEmpty"
    viewBox="0 0 40 20"
    refX="40"
    refY="10"
    markerWidth="25" 
    markerHeight="25"// Aumentar la altura
    orient="auto"
  >
    <path d="M 0 10 L 20 0 L 40 10 L 20 20 Z" fill="none" stroke="black" strokeWidth="1" /> {/* Grosor de línea delgada */}
  </marker>
);


// Marcador de rombo lleno para Composición
const DiamondFilled = () => (
  <marker
    id="diamondFilled"
    viewBox="0 0 40 20"
    refX="40"
    refY="10"
    markerWidth="25" 
    markerHeight="25" // Aumentar la altura
    orient="auto"
  >
    <path d="M 0 10 L 20 0 L 40 10 L 20 20 Z" fill="black" />
  </marker>
);

// Marcador de flecha simple para Asociación
const ArrowMarker = () => (
  <marker
    id="arrow"
    viewBox="0 0 10 10"
    refX="10"
    refY="5"
    markerWidth="10"
    markerHeight="7"
    orient="auto"
  > 
    <path d="M 0 5 L 10 0 L 10 10 Z" fill="none" stroke="white" strokeWidth="1" />
  </marker>
);
const CustomEdgeStartEnd = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  console.log({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  // Use `getBezierPath` and join if necessary
  let edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // If `getBezierPath` returns an array, join the values
  if (Array.isArray(edgePath)) {
    edgePath = edgePath.join(' ');
  }

  console.log({ sourceX, sourceY, targetX, targetY, edgePath }); // Log parameters

  // Validate the edgePath
  if (!edgePath || typeof edgePath !== "string") {
    console.error("Invalid edgePath:", edgePath);
    return null; // Handle this case gracefully
  }

  const markerEndId = {
    Association: "arrow",
    Aggregation: "diamondEmpty",
    Composition: "diamondFilled",
    Generalization: "triangle",
  }[data.type] || "Association"; // Default to Association
  if (edgePath && typeof edgePath === "string" && edgePath.trim().length > 0) {
    // Solo renderizar si edgePath es válido
    return (
      <>
        <svg className="edge-svg">
          <TriangleArrow />
          <DiamondEmpty />
          <DiamondFilled />
          <ArrowMarker />
        </svg>
  
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={`url(#${markerEndId})`}
          style={{ stroke: "#000", strokeWidth: 1 }} 
        />
  
        <EdgeLabelRenderer>
          {data.startLabel && (
            <EdgeLabel
              transform={`translate(0%, -20%) translate(${sourceX}px, ${sourceY - 25}px)`}
              label={data.startLabel}
            />
          )}
          {data.endLabel && (
            <EdgeLabel
              transform={`translate(-100%, -20%) translate(${targetX}px, ${targetY - 25}px)`}
              label={data.endLabel}
            />
          )}
        </EdgeLabelRenderer>
      </>
    );
  } else {
    console.error("Invalid edgePath:", edgePath);
    return null; // Evitar que se renderice un edge inválido
  }
};


export default CustomEdgeStartEnd;

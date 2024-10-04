import React from 'react';

const EdgeLabel = ({ label, transform }) => {
    return (
      <g transform={transform}>
        <text
          style={{
            fill: '#000',
            fontSize: '12px',
            textAnchor: 'middle',
          }}
          dy="-10"
        >
          {label}
        </text>
      </g>
    );
  };
  
export default EdgeLabel;

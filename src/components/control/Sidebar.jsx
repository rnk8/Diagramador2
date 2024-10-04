import React, { useState, useEffect } from "react";

const Sidebar = ({
  addNode,
  selectedNode,
  editingEdge,
  selectedEdge,
  editingData,
  handleInputChange,
  handleInputChangeEdge,
  handleArrayChange,
  updateNodeData,
  updateEdgeData,
}) => {
  const [showNodeInfo, setShowNodeInfo] = useState(true); // Controla la visibilidad de la información del nodo o edge

  const toggleNodeInfo = () => {
    setShowNodeInfo(!showNodeInfo);
  };

  // Opciones de cardinalidad de UML
  const cardinalityOptions = [
    "0..1",
    "1",
    "0..*",
    "1..*",
    "*",
  ];

  // Efecto para limpiar los campos de cardinalidad cuando se selecciona Agregación, Composición o Generalización
  useEffect(() => {
    if (editingEdge?.type === "Aggregation" || editingEdge?.type === "Composition" || editingEdge?.type === "Generalization") {
      handleInputChangeEdge({ target: { name: "startLabel", value: "" } });
      handleInputChangeEdge({ target: { name: "endLabel", value: "" } });
    }
  }, [editingEdge?.type]);

  return (
    <div className="flex h-screen w-64 bg-gray-100 shadow-lg rounded-r-lg">
      <div className="flex flex-col items-center py-4 w-full">
        <button
          onClick={addNode}
          className="bg-gray-300 text-black py-2 px-3 rounded-full mb-4 hover:bg-gray-400 transition-colors duration-200 w-full"
        >
          Crear ClassNode
        </button>

        <div className="flex-grow w-full">
          {selectedNode && (
            <li className="text-black text-sm w-full">
              <div className="bg-gray-200 p-4 rounded-md">
                <h3 className="text-black text-lg font-bold mb-2">
                  Editando: {selectedNode.data.className}
                </h3>

                <button
                  onClick={toggleNodeInfo}
                  className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-400 transition-colors duration-200 mb-3 w-full"
                >
                  {showNodeInfo ? "Ocultar información" : "Mostrar información"}
                </button>

                {showNodeInfo && (
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Nombre de la clase:
                      <input
                        type="text"
                        name="className"
                        value={editingData.className}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 mt-1 rounded bg-gray-300 text-black"
                      />
                    </label>

                    <label className="block text-gray-700 mb-2">
                      Atributos:
                      <textarea
                        name="attributes"
                        value={editingData.attributes.join("\n")}
                        onChange={(e) =>
                          handleArrayChange("attributes", e.target.value)
                        }
                        className="w-full px-2 py-1 mt-1 rounded bg-gray-300 text-black"
                        rows="3"
                      />
                    </label>

                    <label className="block text-gray-700 mb-2">
                      Métodos:
                      <textarea
                        name="methods"
                        value={editingData.methods.join("\n")}
                        onChange={(e) =>
                          handleArrayChange("methods", e.target.value)
                        }
                        className="w-full px-2 py-1 mt-1 rounded bg-gray-300 text-black"
                        rows="3"
                      />
                    </label>

                    <button
                      onClick={updateNodeData}
                      className="mt-3 w-full bg-green-500 text-white py-2 px-3 rounded hover:bg-green-400 transition-colors duration-200"
                    >
                      Guardar cambios
                    </button>
                  </div>
                )}
              </div>
            </li>
          )}

          {selectedEdge && (
            <div className="bg-white shadow-md rounded-lg p-4 w-full">
              <h3 className="text-lg font-semibold mb-4">Editar Arista</h3>

              {/* Selector para el Tipo de Conexión */}
              <label className="block text-sm font-medium mb-2">
                Tipo de Conexión:
              </label>
              <select
                name="type"
                value={editingEdge?.type || "Association"}
                onChange={handleInputChangeEdge}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="Association">Asociación</option>
                <option value="Aggregation">Agregación</option>
                <option value="Composition">Composición</option>
                <option value="Generalization">Generalización</option>
              </select>

              {/* Mostrar las opciones de cardinalidad solo para Asociación */}
              {editingEdge?.type === "Association" && (
                <>
                  {/* Selector para Cardinalidad de Inicio */}
                  <label className="block text-sm font-medium mb-2">
                    Cardinalidad de inicio:
                  </label>
                  <select
                    name="startLabel"
                    value={editingEdge?.startLabel || ""}
                    onChange={handleInputChangeEdge}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  >
                    <option value="">Seleccionar</option>
                    {cardinalityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {/* Selector para Cardinalidad de Fin */}
                  <label className="block text-sm font-medium mb-2">
                    Cardinalidad de fin:
                  </label>
                  <select
                    name="endLabel"
                    value={editingEdge?.endLabel || ""}
                    onChange={handleInputChangeEdge}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  >
                    <option value="">Seleccionar</option>
                    {cardinalityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Botón para actualizar la arista */}
              <button
                onClick={updateEdgeData}
                className="w-full bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              >
                Actualizar Arista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

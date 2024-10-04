import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase-confing/Firebase";
import Swal from "sweetalert2";
import Modal from "react-modal";
import { QRCodeCanvas } from "qrcode.react";

// Define el elemento de la aplicación
Modal.setAppElement("#root"); // Cambia '#root' por el ID correcto si es necesario

const Board = () => {
  const [description, setDescription] = useState("");
  const [boardList, setBoardList] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [inviteModalIsOpen, setInviteModalIsOpen] = useState(false); // Modal para invitar
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [xmlContent, setXmlContent] = useState(""); // Nuevo estado para el contenido del XML

  const navigate = useNavigate();
  const boardCollection = collection(db, "board");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "El nombre del tablero es obligatorio!",
      });
      return;
    }

    try {
      await addDoc(boardCollection, { description });
      Swal.fire({
        title: "Tablero creado!",
        text: "Tu tablero ha sido agregado exitosamente.",
        icon: "success",
      });
      setDescription("");
      setModalIsOpen(false);
      getBoardList();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "No se pudo crear el tablero!",
      });
      console.error("Error al crear el tablero: ", error);
    }
  };

  const getBoardList = async () => {
    const data = await getDocs(boardCollection);
    setBoardList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const deleteBoard = async (id) => {
    const boardDoc = doc(db, "board", id);
    try {
      await deleteDoc(boardDoc);
      getBoardList();
    } catch (error) {
      console.error("Error al eliminar el tablero: ", error);
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "No se pudo eliminar el tablero!",
      });
    }
  };

  const confirmDelete = (id) => {
    Swal.fire({
      title: "Eliminar Tablero?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteBoard(id);
        Swal.fire("Eliminado!", "Tu tablero ha sido eliminado.", "success");
      }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "El nombre del tablero es obligatorio!",
      });
      return;
    }

    const boardDoc = doc(db, "board", currentBoardId);
    try {
      await updateDoc(boardDoc, { description });
      Swal.fire({
        title: "Tablero editado!",
        text: "Tu tablero ha sido actualizado exitosamente.",
        icon: "success",
      });
      setDescription("");
      setEditModalIsOpen(false);
      getBoardList();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "No se pudo editar el tablero!",
      });
      console.error("Error al editar el tablero: ", error);
    }
  };

  const inviteUser = (boardId) => {
    setCurrentBoardId(boardId); // Establece el ID del tablero actual
    setInviteModalIsOpen(true); // Abre el modal de invitación
  };

  const handleCopyLink = (boardId) => {
    const inviteLink = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        Swal.fire({
          title: "Enlace copiado!",
          text: "El enlace para invitar ha sido copiado al portapapeles.",
          icon: "success",
        });
      })
      .catch((error) => {
        console.error("Error al copiar el enlace: ", error);
        Swal.fire({
          icon: "error",
          title: "Error...",
          text: "No se pudo copiar el enlace!",
        });
      });
  };

  const openEditModal = (board) => {
    setDescription(board.description);
    setCurrentBoardId(board.id);
    setEditModalIsOpen(true);
  };

  // Manejar la carga de XML
  const handleXmlUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setXmlContent(content); // Guardar el contenido del XML
      processXml(content); // Procesar el archivo XML
    };
    reader.readAsText(file);
  };
  
  // Función para procesar el XML
  const processXml = (xmlText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  
    // Procesar nodos (clases)
    const nodes = xmlDoc.getElementsByTagName("UML:Class");
  
    // Filtrar la clase 'EARootClass' si existe
    const parsedNodes = Array.from(nodes)
      .filter((cls) => cls.getAttribute("name") !== "EARootClass")
      .map((cls, index) => {
        const attributes = Array.from(cls.getElementsByTagName("UML:Attribute")).map(
          (attr) => `+ ${attr.getAttribute("name")}: ${attr.getAttribute("type") || 'string'}`
        );
        const methods = Array.from(cls.getElementsByTagName("UML:Method")).map(
          (meth) => `+ ${meth.getAttribute("name")}(): ${meth.getAttribute("returnType") || 'void'}`
        );
  
        return {
          data: {
            className: cls.getAttribute("name"),
            attributes: attributes,
            methods: methods,
          },
          dragging: false,
          id: (index + 1).toString(),
          measured: {
            height: 176,
            width: 220,
          },
          position: {
            x: Math.random() * 600, // Ajustar posición inicial
            y: Math.random() * 400,
          },
          selected: false,
          type: "classNode",
        };
      });
  
    // Procesar aristas (relaciones/edges entre clases)
    const associations = xmlDoc.getElementsByTagName("UML:AssociationEnd");
    const parsedEdges = Array.from(associations).map((assoc, index) => {
      const sourceElement = assoc.getElementsByTagName("UML:Source")[0];
      const targetElement = assoc.getElementsByTagName("UML:Target")[0];
  
      if (!sourceElement || !targetElement) {
          console.warn(`Warning: UML:Source o UML:Target no encontrado en la relación ${index + 1}`);
          return null; // Aquí podemos omitir esta asociación
      }
  
      const source = sourceElement.getElementsByTagName("ref")[0]?.textContent; // Ajustar acceso
      const target = targetElement.getElementsByTagName("ref")[0]?.textContent; // Ajustar acceso
  
      if (!source || !target) {
          console.warn(`Warning: Atributos ref no encontrados en UML:Source o UML:Target en relación ${index + 1}`);
          return null; // Aquí también omitimos la asociación
      }
  
      const startLabel = assoc.getElementsByTagName("UML:StartLabel")[0]?.textContent || "0..*";
      const endLabel = assoc.getElementsByTagName("UML:EndLabel")[0]?.textContent || "1";
      const type = assoc.getAttribute("type") || "Association"; // Tipo de relación
  
      return {
          data: {
              startLabel: startLabel,
              endLabel: endLabel,
              type: type,
          },
          id: `xy-edge__${source}right-${target}left`,
          selected: false,
          source: source,
          sourceHandle: "right",
          target: target,
          targetHandle: "left",
          type: "start-end",
      };
  }).filter(edge => edge !== null); // Filtrar relaciones nulas
  
  
    // Verificar si se han encontrado nodos y aristas
    if (parsedNodes.length > 0 || parsedEdges.length > 0) {
      const newBoardDescription = `Tablero de ${parsedNodes[0].data.className}`;
      createBoardFromXml(newBoardDescription, parsedNodes, parsedEdges);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "No se encontraron clases o relaciones en el archivo XML",
      });
    }
  };
  
  
  const createBoardFromXml = async (description, parsedClasses, parsedEdges) => {
    try {
      // Guardar nodos y edges en Firebase
      await addDoc(boardCollection, {
        description,
        nodes: parsedClasses, // Guardar los nodos correctamente
        edges: parsedEdges,   // Guardar los edges correctamente
      });
  
      Swal.fire({
        title: "Tablero creado!",
        text: `El tablero "${description}" ha sido agregado exitosamente.`,
        icon: "success",
      });
  
      getBoardList();
    } catch (error) {
      console.error("Error al crear el tablero desde el XML: ", error);
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "No se pudo crear el tablero desde el XML!",
      });
    }
    
  };
  
  useEffect(() => {
    getBoardList();
  }, [xmlContent]);
    
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tableros</h1>
        {/* Botón para importar XML */}
        <div className="mb-6">
          <label
            htmlFor="fileInput"
            className="w-full py-2 px-6 text-white bg-blue-700 rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
          >
            Importar XML
          </label>
          <input
            type="file"
            id="fileInput"
            accept=".xml"
            onChange={handleXmlUpload}
            className="hidden" // Ocultar el input y manejar el click desde el label
          />
        </div>
        {/* Lista de Tableros */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Tableros Disponibles
          </h2>
          <ul className="space-y-3">
            {boardList.length > 0 ? (
              boardList.map((board) => (
                <li
                  key={board.id}
                  className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
                >
                  <span className="text-gray-800 font-medium">
                    {board.description}
                  </span>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => inviteUser(board.id)}
                      className="text-green-500 hover:underline"
                    >
                      Invitar
                    </button>
                    <button
                      onClick={() => navigate(`/board/${board.id}`)}
                      className="text-blue-500 hover:underline"
                    >
                      Ver Tablero
                    </button>
                    <button
                      onClick={() => openEditModal(board)}
                      className="text-yellow-500 hover:underline"
                    >
                      Editar Tablero
                    </button>
                    <button
                      onClick={() => confirmDelete(board.id)}
                      className="text-red-500 hover:underline"
                    >
                      Eliminar Tablero
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-600">No hay tableros disponibles.</li>
            )}
          </ul>
        </div>

        {/* Botón para abrir el modal */}
        <button
          onClick={() => setModalIsOpen(true)}
          className="w-full py-2  text-white bg-blue-700 rounded-lg hover:bg-green-600 transition-colors"
        >
          Crear Nuevo Tablero
        </button>

        {/* Modal para crear el tablero */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto my-10"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Crear Tablero
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700">
                Nombre del Tablero
              </label>
              <input
                type="text"
                id="description"
                className="w-full px-4 py-2 mt-1 rounded-md border bg-gray-100"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={() => setModalIsOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Crear Tablero
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal para editar el tablero */}
        <Modal
          isOpen={editModalIsOpen}
          onRequestClose={() => setEditModalIsOpen(false)}
          className="modal bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto my-10"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Editar Tablero
          </h2>
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700">
                Nombre del Tablero
              </label>
              <input
                type="text"
                id="description"
                className="w-full px-4 py-2 mt-1 rounded-md border bg-gray-100"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={() => setEditModalIsOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal de invitación */}
        {/* Modal de invitación */}
        <Modal
          isOpen={inviteModalIsOpen}
          onRequestClose={() => setInviteModalIsOpen(false)}
          className="modal bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto my-10"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Invitar Usuarios
          </h2>
          <p className="text-gray-600 mb-4">
            Comparte este enlace o escanea el código QR para invitar a otros a
            tu tablero.
          </p>
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={() => handleCopyLink(currentBoardId)} // Copia el enlace al portapapeles
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
            >
              Copiar Enlace
            </button>
            <QRCodeCanvas
              value={`${window.location.origin}/board/${currentBoardId}`}
              size={256}
            />{" "}
            {/* Aumenta el tamaño del código QR */}
          </div>
          <button
            onClick={() => setInviteModalIsOpen(false)}
            className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cerrar
          </button>
        </Modal>
      </div>
    </div>
  );
};

export default Board;

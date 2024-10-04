import React, { useCallback, useState, useEffect } from "react";
import {
  Background,
  Controls,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassNode from "../components/tablas/ClassNode";
import { useParams } from "react-router-dom";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import Sidebar from "../components/control/Sidebar";
import CustomEdgeStartEnd from "../components/CustomEdgeStartEnd";
import { onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase-confing/Firebase";

const nodeTypes = { classNode: ClassNode };
const edgeTypes = { "start-end": CustomEdgeStartEnd };
const edgeOptions = { animated: true, style: { stroke: "black" } };
const connectionLineStyle = { stroke: "black" };
let nodeId = 0;

const BoardPage = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const { id: boardId } = useParams();

  const reactFlowInstance = useReactFlow();

  // Función genérica para actualizar Firebase (nodos o aristas)
  const updateBoardData = async (updatedData, key) => {
    try {
      const boardDocRef = doc(db, "board", boardId);
      await updateDoc(boardDocRef, { [key]: updatedData });
    } catch (error) {
      console.error(`Error al actualizar ${key} en Firebase:`, error);
    }
  };
  // Sincronización de nodos y Firebase
  const onNodesChange = useCallback(
    async (changes) => {
      const hasDeletedNodes = changes.some(
        (change) => change.type === "remove"
      );
      setNodes((nds) => applyNodeChanges(changes, nds));

      if (hasDeletedNodes) {
        const nodesToDelete = changes
          .filter((change) => change.type === "remove")
          .map((change) => change.id);
        try {
          const boardDocRef = doc(db, "board", boardId);
          const boardSnapshot = await getDoc(boardDocRef);
          if (boardSnapshot.exists()) {
            const currentNodes = boardSnapshot.data().nodes || [];
            const updatedNodes = currentNodes.filter(
              (node) => !nodesToDelete.includes(node.id)
            );
            await updateBoardData(updatedNodes, "nodes");
          }
        } catch (error) {
          console.error("Error al eliminar el nodo de Firebase:", error);
        }
      }
    },
    [boardId]
  );

  // Sincronización de aristas y Firebase
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      const updatedEdges = applyEdgeChanges(changes, edges);
      updateBoardData(updatedEdges, "edges");
    },
    [edges, boardId]
  );

  const onConnect = useCallback(
    (connection) => {
      console.log("Nueva conexión:", connection);

      // Verificar si los valores clave están presentes en `connection`
      if (!connection.source || !connection.target) {
        console.error("Conexión inválida:", connection);
        return;
      }

      const newEdge = {
        ...connection,
        data: {
          startLabel: connection.startLabel || "0..*", // Asegurarse de que las etiquetas existan
          endLabel: connection.endLabel || "1",
          type: connection.type || "Association", // Tipo predeterminado
        },
        type: "start-end",
      };

      console.log("Nueva arista creada:", newEdge);

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      updateBoardData(updatedEdges, "edges");
    },
    [edges, boardId]
  );

  // Agregar nodos a Firebase
  const addNode = useCallback(async () => {
    nodeId++; // Incrementa el nodeId
    const newNode = {
      id: `${nodeId}`, // Usar el nodeId que se incrementó
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      type: "classNode",
      data: {
        className: `Clase ${nodeId}`,
        attributes: ["+ nuevoAtributo: string"],
        methods: ["+ nuevoMetodo(): void"],
      },
    };

    try {
      const boardDocRef = doc(db, "board", boardId);
      const boardSnapshot = await getDoc(boardDocRef);
      if (boardSnapshot.exists()) {
        const currentNodes = boardSnapshot.data().nodes || [];
        const updatedNodes = [...currentNodes, newNode];
        await updateBoardData(updatedNodes, "nodes");
        setNodes(updatedNodes);
      }
      reactFlowInstance.addNodes(newNode);
    } catch (error) {
      console.error("Error al agregar el nodo a Firebase:", error);
    }
  }, [reactFlowInstance, boardId]);

  // Actualiza la posición de un nodo en Firebase al soltar
  const onNodeDragStop = useCallback(
    async (_event, node) => {
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setNodes(updatedNodes);
      updateBoardData(updatedNodes, "nodes");
    },
    [nodes, boardId]
  );

  // Maneja la edición de nodos
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setEditingData({ ...node.data });
  };
  // Maneja la edición de aristas
  const onEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setEditingEdge({ ...edge.data });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInputChangeEdge = (event) => {
    const { name, value } = event.target;

    setEditingEdge((prev) => ({
      ...prev,
      [name]: value, // Se actualiza el campo correcto en función del name del input
    }));
  };

  const handleArrayChange = (name, value) => {
    setEditingData((prev) => ({
      ...prev,
      [name]: value.split("\n"),
    }));
  };

  const updateNodeData = async () => {
    const updatedNodes = nodes.map((node) =>
      node.id === selectedNode.id ? { ...node, data: editingData } : node
    );
    setNodes(updatedNodes);
    await updateBoardData(updatedNodes, "nodes");
    setSelectedNode(null);
  };

  const updateEdgeData = async () => {
    const updatedEdges = edges.map((edge) =>
      edge.id === selectedEdge.id
        ? { ...edge, data: { ...editingEdge, type: editingEdge.type } }
        : edge
    );
    setEdges(updatedEdges);
    await updateBoardData(updatedEdges, "edges");
    setSelectedEdge(null);
  };
  //funcion atribute
  const atribute = (name, i, id) => {
    return  `<UML:Attribute name="${name}" changeable="none" visibility="private" ownerScope="instance" targetScope="instance">
									<UML:Attribute.initialValue>
										<UML:Expression/>
									</UML:Attribute.initialValue>
									<UML:StructuralFeature.type>
										<UML:Classifier xmi.idref="eaxmiid${i}${id}"/>
									</UML:StructuralFeature.type>
									<UML:ModelElement.taggedValue>
										<UML:TaggedValue tag="type" value="int"/>
										<UML:TaggedValue tag="containment" value="Not Specified"/>
										<UML:TaggedValue tag="ordered" value="0"/>
										<UML:TaggedValue tag="collection" value="false"/>
										<UML:TaggedValue tag="position" value="0"/>
										<UML:TaggedValue tag="lowerBound" value="1"/>
										<UML:TaggedValue tag="upperBound" value="1"/>
										<UML:TaggedValue tag="duplicates" value="0"/>
										<UML:TaggedValue tag="ea_guid" value="{C2602A54-4A22-45f7-ABAA-4FBE30A2EF6${id}${i}}"/>
										<UML:TaggedValue tag="ea_localid" value="27"/>
										<UML:TaggedValue tag="styleex" value="volatile=0;"/>
									</UML:ModelElement.taggedValue>
								</UML:Attribute>
							`;
  };
//Funcion para asociones 
const association=()=>{
  let associaciones = ''
  edges.map ((flecha, i)=>{
    associaciones = associaciones + `<UML:Association xmi.id="${flecha.id}" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">`
    + `<UML:ModelElement.taggedValue>
								<UML:TaggedValue tag="style" value="3"/>
								<UML:TaggedValue tag="ea_type" value="${flecha.data.type}"/>
								<UML:TaggedValue tag="direction" value="Unspecified"/>
								<UML:TaggedValue tag="linemode" value="3"/>
								<UML:TaggedValue tag="linecolor" value="-1"/>
								<UML:TaggedValue tag="linewidth" value="0"/>
								<UML:TaggedValue tag="seqno" value="0"/>
								<UML:TaggedValue tag="headStyle" value="0"/>
								<UML:TaggedValue tag="lineStyle" value="0"/>
								<UML:TaggedValue tag="ea_localid" value="${flecha.id}-${i}"/>
								<UML:TaggedValue tag="ea_sourceName" value="Persona"/>
								<UML:TaggedValue tag="ea_targetName" value="Bicicleta"/>
								<UML:TaggedValue tag="ea_sourceType" value="Class"/>
								<UML:TaggedValue tag="ea_targetType" value="Class"/>  
								<UML:TaggedValue tag="ea_sourceID" value="nodo-${flecha.source}"/>
								<UML:TaggedValue tag="ea_targetID" value="nodo-${flecha.target}"/>
								<UML:TaggedValue tag="virtualInheritance" value="0"/>
								<UML:TaggedValue tag="lb" value="1"/>
								<UML:TaggedValue tag="rb" value="1"/>
							</UML:ModelElement.taggedValue> `
              + `<UML:Association.connection>
								<UML:AssociationEnd visibility="public" multiplicity="${flecha.data.startLabel}" aggregation="none  " isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_MYCLASS_00${flecha.source}">
									<UML:ModelElement.taggedValue>
										<UML:TaggedValue tag="containment" value="Unspecified"/>
										<UML:TaggedValue tag="sourcestyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
										<UML:TaggedValue tag="ea_end" value="source"/>
									</UML:ModelElement.taggedValue>
								</UML:AssociationEnd>
								<UML:AssociationEnd visibility="public" multiplicity="${flecha.data.endLabel}" aggregation="${flecha.data.type == 'Association' ? 'none' : (flecha.data.type == 'Aggregation' ? 'shared' : 'composite' ) }" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_MYCLASS_00${flecha.target}">
									<UML:ModelElement.taggedValue>
										<UML:TaggedValue tag="containment" value="Unspecified"/>
										<UML:TaggedValue tag="deststyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
										<UML:TaggedValue tag="ea_end" value="target"/>
									</UML:ModelElement.taggedValue>
								</UML:AssociationEnd>
							</UML:Association.connection>
              </UML:Association>`;
  })
  return associaciones;
}
  //FUNCION DE EXPORTAR
  async function saveXMLFile() {
    let classes = "";
    let element = "";
    let at = ''   
    const xmlContent = `<?xml version="1.0" encoding="windows-1252"?>
<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="2024-10-04 05:45:18">
	<XMI.header>
		<XMI.documentation>
			<XMI.exporter>Enterprise Architect</XMI.exporter>
			<XMI.exporterVersion>2.5</XMI.exporterVersion>
		</XMI.documentation>
	</XMI.header>
	<XMI.content>
		<UML:Model name="EA Model" xmi.id="MX_EAID_8510AB1B_CCEC_4186_AAF7_EB9893025F80">
			<UML:Namespace.ownedElement>
				<UML:Class name="EARootClass" xmi.id="EAID_11111111_5487_4080_A7F4_41526CB0AA00" isRoot="true" isLeaf="false" isAbstract="false"/>
				<UML:Package name="Class Model" xmi.id="EAPK_8510AB1B_CCEC_4186_AAF7_EB9893025F80" isRoot="false" isLeaf="false" isAbstract="false" visibility="public">
					<UML:ModelElement.taggedValue>
						<UML:TaggedValue tag="parent" value="EAPK_AAD25E0C_27E3_44c2_B427_87D636B2D17C"/>
						<UML:TaggedValue tag="ea_package_id" value="86"/>
						<UML:TaggedValue tag="created" value="2024-10-04 05:42:06"/>
						<UML:TaggedValue tag="modified" value="2024-10-04 05:45:02"/>
						<UML:TaggedValue tag="iscontrolled" value="FALSE"/>
						<UML:TaggedValue tag="isnamespace" value="1"/>
						<UML:TaggedValue tag="lastloaddate" value="2024-10-04 05:42:06"/>
						<UML:TaggedValue tag="lastsavedate" value="2024-10-04 05:42:06"/>
						<UML:TaggedValue tag="isprotected" value="FALSE"/>
						<UML:TaggedValue tag="usedtd" value="FALSE"/>
						<UML:TaggedValue tag="logxml" value="FALSE"/>
						<UML:TaggedValue tag="tpos" value="6"/>
						<UML:TaggedValue tag="packageFlags" value="isModel=1;VICON=3;CRC=0;"/>
						<UML:TaggedValue tag="batchsave" value="0"/>
						<UML:TaggedValue tag="batchload" value="0"/>
						<UML:TaggedValue tag="phase" value="1.0"/>
						<UML:TaggedValue tag="status" value="Proposed"/>
						<UML:TaggedValue tag="author" value="HttpRen"/>
						<UML:TaggedValue tag="complexity" value="1"/>
						<UML:TaggedValue tag="ea_stype" value="Public"/>
						<UML:TaggedValue tag="tpos" value="6"/>
					</UML:ModelElement.taggedValue>
					<UML:Namespace.ownedElement>`;

    nodes.map((node, i) => {
      classes =
        classes +
        ` <UML:Class name="${node.data.className}" xmi.id="EAID_MYCLASS_00${node.id}" visibility="public" namespace="EAPK_8510AB1B_CCEC_4186_AAF7_EB9893025F80" isRoot="false" isLeaf="false" isAbstract="false" isActive="false">
                <UML:ModelElement.taggedValue>
								<UML:TaggedValue tag="isSpecification" value="false"/>
								<UML:TaggedValue tag="ea_stype" value="Class"/>
								<UML:TaggedValue tag="ea_ntype" value="0"/>
								<UML:TaggedValue tag="version" value="1.0"/>
								<UML:TaggedValue tag="package" value="EAPK_8510AB1B_CCEC_4186_AAF7_EB9893025F80"/>
								<UML:TaggedValue tag="date_created" value="2024-10-04 05:42:51"/>
								<UML:TaggedValue tag="date_modified" value="2024-10-04 05:42:55"/>
								<UML:TaggedValue tag="gentype" value="Java"/>
								<UML:TaggedValue tag="tagged" value="0"/>
								<UML:TaggedValue tag="package_name" value="Class Model"/>
								<UML:TaggedValue tag="phase" value="1.0"/>
								<UML:TaggedValue tag="author" value="HttpRen"/>
								<UML:TaggedValue tag="complexity" value="1"/>
								<UML:TaggedValue tag="product_name" value="Java"/>
								<UML:TaggedValue tag="status" value="Proposed"/>
								<UML:TaggedValue tag="tpos" value="0"/>
								<UML:TaggedValue tag="ea_localid" value="nodo-${node.id}"/>
								<UML:TaggedValue tag="ea_eleType" value="element"/>
								<UML:TaggedValue tag="style" value="BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;"/>
							</UML:ModelElement.taggedValue>
              <UML:Classifier.feature>
              `;
              node.data.attributes.map((atribute1, ii) => {
                classes = classes + atribute(atribute1, ii, node.id)
              });
              classes = classes +  
              `</UML:Classifier.feature> 
              </UML:Class>`;

        element =
        element +
        `<UML:DiagramElement geometry="Left=${parseInt(
          node.position.x + 30
        )};Top=${parseInt(node.position.y + 90)};Right=${parseInt(
          node.position.x + 50
        )};Bottom=${parseInt(node.position.y + 60)};" subject="EAID_MYCLASS_00${
          node.id
        }" seqno="${i + 1}" style="DUID=12345;"/>
        `;
    });
    classes= classes + association() ;
    const body1 = `</UML:Namespace.ownedElement>
    				</UML:Package>
				</UML:Namespace.ownedElement>
		</UML:Model>
		<UML:Diagram name="Class Model" xmi.id="EAID_0302CD9D_98A9_4585_BA1E_76226685392F" diagramType="ClassDiagram" owner="EAPK_8510AB1B_CCEC_4186_AAF7_EB9893025F80" toolName="Enterprise Architect 2.5">
			<UML:ModelElement.taggedValue>
				<UML:TaggedValue tag="version" value="1.0"/>
				<UML:TaggedValue tag="author" value="HttpRen"/>
				<UML:TaggedValue tag="created_date" value="2024-10-04 05:42:06"/>
				<UML:TaggedValue tag="modified_date" value="2024-10-04 05:43:59"/>
				<UML:TaggedValue tag="package" value="EAPK_8510AB1B_CCEC_4186_AAF7_EB9893025F80"/>
				<UML:TaggedValue tag="type" value="Logical"/>
				<UML:TaggedValue tag="swimlanes" value="locked=false;orientation=0;width=0;inbar=false;names=false;color=0;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=0;ufh=0;cls=0;SwimlaneFont=lfh:-13,lfw:0,lfi:0,lfu:0,lfs:0,lfface:Calibri,lfe:0,lfo:0,lfchar:1,lfop:0,lfcp:0,lfq:0,lfpf=0,lfWidth=0;"/>
				<UML:TaggedValue tag="matrixitems" value="locked=false;matrixactive=false;swimlanesactive=true;kanbanactive=false;width=1;clrLine=0;"/>
				<UML:TaggedValue tag="ea_localid" value="83"/>
				<UML:TaggedValue tag="EAStyle" value="ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=0;HighlightForeign=0;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=0;PPgs.cy=0;DocSize.cx=827;DocSize.cy=1169;ShowDetails=0;Orientation=P;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=9;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.0;ExplicitNavigability=0;ShowShape=1;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;ShowNotes=0;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;"/>
				<UML:TaggedValue tag="styleex" value="SaveTag=0F638E8A;ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.0;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;ProfileData=;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;"/>
			</UML:ModelElement.taggedValue>`;

    const body2 = `
            <UML:Diagram.element>
              ${element}
            </UML:Diagram.element>
		</UML:Diagram>
	</XMI.content>
	<XMI.difference/>
	<XMI.extensions xmi.extender="Enterprise Architect 2.5"/>
</XMI>`;

    const opts = {
      type: "save-file",
      suggestedName: "diagram.xml",
      types: [
        {
          description: "XMI Files",
          accept: {
            "text/xml": [".xml"],
          },
        },
      ],
    };

    try {
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(xmlContent + classes + body1 + body2);
      await writable.close();
      console.log("Archivo guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar el archivo:", error);
    }
  }

  // Escucha en tiempo real los cambios en Firebase
  useEffect(() => {
    const boardDocRef = doc(db, "board", boardId);
    const unsubscribe = onSnapshot(boardDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const boardData = docSnapshot.data();
        setNodes(boardData.nodes || []);
        setEdges(boardData.edges || []);
        nodeId = boardData.nodes.length;
      }
    });
    return () => unsubscribe();
  }, [boardId]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <Sidebar
        addNode={addNode}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        editingData={editingData}
        editingEdge={editingEdge}
        handleInputChange={handleInputChange}
        handleArrayChange={handleArrayChange}
        handleInputChangeEdge={handleInputChangeEdge}
        updateNodeData={updateNodeData}
        updateEdgeData={updateEdgeData}
      />
      <div style={{ flex: 1, position: "relative" }}>
        <div>
          <button
            onClick={saveXMLFile}
            className="bg-gray-300 text-black py-2 px-3 rounded-full mb-4 hover:bg-gray-400 transition-colors duration-200 "
          >
            Exportar XML
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          edgeOptions={edgeOptions}
          style={{ width: "100%", height: "100%" }}
          connectionLineStyle={connectionLineStyle}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default function () {
  return (
    <ReactFlowProvider>
      <BoardPage />
    </ReactFlowProvider>
  );
}

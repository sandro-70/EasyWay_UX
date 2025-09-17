// src/TestAuth.jsx
import React, { useEffect, useState } from "react";
import {
  getAllProducts,
  crearProducto,
  actualizarProducto,
  listarProductosporsucursal,
  listarProductosl
} from "../api/InventarioApi";
import { getStock } from "../api/reporteusuarioApi";
import {
  uploadProductPhotos,
  uploadProductPhotos2,
} from "../api/Usuario.Route";
import { subirImagenesProducto } from "../api/InventarioApi";

export default function TestAuth() {
  const [products, setProducts] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [productId, setProductId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [modo, setModo] = useState("sumar");
  const [etiquetas, setEtiquetas] = useState("");

  // Nuevo estado para productos por sucursal
  const [productosSucursal, setProductosSucursal] = useState([]);
  const [rawResponseSucursal, setRawResponseSucursal] = useState(null);
  const [loadingSucursal, setLoadingSucursal] = useState(false);
  const [sucursalIdInput, setSucursalIdInput] = useState("");

  const [updateProductData, setUpdateProductData] = useState({
    id_producto: "",
    nombre: "",
    descripcion: "",
    precio_base: "",
    id_subcategoria: "",
    porcentaje_ganancia: "",
    id_marca: "",
    etiquetas: "",
    unidad_medida: "unidad",
    activo: true,
    peso: "",
  });

  // Helper para tomar el array correcto aun si tu backend envía {data} | {rows} | {products}
  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.items)) return payload.items;
    // Si no vino un array, devolvemos vacío y guardamos el crudo para inspección
    return [];
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await listarProductosl(); // axios response
      setRawResponse(res?.data ?? null);
      const arr = extractArray(res?.data);
      setProducts(arr);
      console.log("[PRODUCTOS] status:", res?.status);
      console.log("[PRODUCTOS] data:", res?.data);
    } catch (err) {
      console.error("[PRODUCTOS] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al obtener productos");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para obtener productos por sucursal
  const fetchProductosPorSucursal = async () => {
    if (!sucursalIdInput.trim()) {
      alert("Ingresa un ID de sucursal válido");
      return;
    }

    try {
      setLoadingSucursal(true);
      const res = await listarProductosporsucursal(sucursalIdInput);

      setRawResponseSucursal(res?.data ?? null);
      const arr = extractArray(res?.data);
      setProductosSucursal(arr);
      console.log("[PRODUCTOS POR SUCURSAL] status:", res?.status);
      console.log("[PRODUCTOS POR SUCURSAL] data:", res?.data);
      console.log("[PRODUCTOS POR SUCURSAL] ID Sucursal:", sucursalIdInput);
    } catch (err) {
      console.error(
        "[PRODUCTOS POR SUCURSAL] error:",
        err?.response?.data || err
      );
      alert(
        err?.response?.data?.message ||
          "Error al obtener productos de la sucursal"
      );
    } finally {
      setLoadingSucursal(false);
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  // Test uploadProductPhotos function
  const testUploadProductPhotos = async () => {
    if (selectedFiles.length === 0) {
      alert("Selecciona al menos un archivo");
      return;
    }

    try {
      setUploadLoading(true);
      const res = await uploadProductPhotos(selectedFiles);
      setUploadResponse(res?.data ?? null);
      console.log("[UPLOAD PHOTOS] status:", res?.status);
      console.log("[UPLOAD PHOTOS] data:", res?.data);
      alert("Upload exitoso! Revisa la consola y la respuesta abajo.");
    } catch (err) {
      console.error("[UPLOAD PHOTOS] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al subir fotos");
    } finally {
      setUploadLoading(false);
    }
  };

  // Test uploadProductPhotos2 function
  const testUploadProductPhotos2 = async () => {
    if (selectedFiles.length === 0) {
      alert("Selecciona al menos un archivo");
      return;
    }

    try {
      setUploadLoading(true);
      // Create named files array for uploadProductPhotos2
      const namedFiles = selectedFiles.map((file, index) => ({
        file,
        desiredName: `test_image_${index + 1}_${Date.now()}.${file.name
          .split(".")
          .pop()}`,
      }));

      const res = await uploadProductPhotos2(namedFiles);
      setUploadResponse(res?.data ?? null);
      console.log("[UPLOAD PHOTOS 2] status:", res?.status);
      console.log("[UPLOAD PHOTOS 2] data:", res?.data);
      alert("Upload 2 exitoso! Revisa la consola y la respuesta abajo.");
    } catch (err) {
      console.error("[UPLOAD PHOTOS 2] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al subir fotos 2");
    } finally {
      setUploadLoading(false);
    }
  };

  // Test subirImagenesProducto function
  const testSubirImagenesProducto = async () => {
    if (selectedFiles.length === 0) {
      alert("Selecciona al menos un archivo");
      return;
    }

    if (!productId.trim()) {
      alert("Ingresa un ID de producto válido");
      return;
    }

    try {
      setUploadLoading(true);
      const res = await subirImagenesProducto(selectedFiles, productId);
      setUploadResponse(res?.data ?? null);
      console.log("[SUBIR IMAGENES PRODUCTO] status:", res?.status);
      console.log("[SUBIR IMAGENES PRODUCTO] data:", res?.data);
      alert(
        "Subida de imágenes al producto exitosa! Revisa la consola y la respuesta abajo."
      );
    } catch (err) {
      console.error(
        "[SUBIR IMAGENES PRODUCTO] error:",
        err?.response?.data || err
      );
      alert(
        err?.response?.data?.message || "Error al subir imágenes al producto"
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // Test actualizarProducto function
  const testActualizarProducto = async () => {
    if (!updateProductData.id_producto.trim()) {
      alert("Ingresa un ID de producto válido");
      return;
    }

    try {
      setUploadLoading(true);
      const res = await actualizarProducto(
        updateProductData.id_producto,
        updateProductData.nombre,
        updateProductData.descripcion,
        updateProductData.precio_base,
        updateProductData.id_subcategoria,
        updateProductData.porcentaje_ganancia,
        updateProductData.id_marca,
        updateProductData.etiquetas,
        updateProductData.unidad_medida,
        [], // imagenes (no usado en FormData)
        updateProductData.peso,
        selectedFiles // files
      );
      setUploadResponse(res?.data ?? null);
      console.log("[ACTUALIZAR PRODUCTO] status:", res?.status);
      console.log("[ACTUALIZAR PRODUCTO] data:", res?.data);
      alert(
        "Producto actualizado exitosamente! Revisa la consola y la respuesta abajo."
      );
    } catch (err) {
      console.error("[ACTUALIZAR PRODUCTO] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al actualizar producto");
    } finally {
      setUploadLoading(false);
    }
  };

  // Test crearProducto function
  const testCrearProducto = async () => {
    if (
      !updateProductData.nombre.trim() ||
      !updateProductData.precio_base ||
      !updateProductData.id_subcategoria.trim() ||
      !updateProductData.id_marca.trim()
    ) {
      alert("Ingresa nombre, precio base, ID subcategoría y ID marca");
      return;
    }

    try {
      setUploadLoading(true);
      const res = await crearProducto(
        updateProductData.nombre,
        updateProductData.descripcion,
        updateProductData.precio_base,
        updateProductData.id_subcategoria,
        updateProductData.porcentaje_ganancia,
        updateProductData.id_marca,
        updateProductData.etiquetas,
        updateProductData.unidad_medida,
        [], // imagenes (no usado en FormData)
        updateProductData.peso,
        selectedFiles // files
      );
      setUploadResponse(res?.data ?? null);
      console.log("[CREAR PRODUCTO] status:", res?.status);
      console.log("[CREAR PRODUCTO] data:", res?.data);
      alert(
        "Producto creado exitosamente! Revisa la consola y la respuesta abajo."
      );
    } catch (err) {
      console.error("[CREAR PRODUCTO] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al crear producto");
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    // NO: console.log(productos.data) -> 'productos' es la función, no la respuesta
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Test Auth</h2>
      <p>Abre la consola del navegador para ver los logs.</p>

      <div
        style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}
      >
        <button onClick={fetchProductos} disabled={loading}>
          {loading ? "Cargando..." : "Recargar todos los productos"}
        </button>
      </div>

      {/* Nueva sección para productos por sucursal */}
      <h3>Test Productos por Sucursal</h3>
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          border: "2px solid #3b82f6",
          borderRadius: 8,
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
            >
              ID de la Sucursal:
            </label>
            <input
              type="text"
              value={sucursalIdInput}
              onChange={(e) => setSucursalIdInput(e.target.value)}
              placeholder="Ej: 1, 2, 3..."
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                width: "150px",
                fontSize: 14,
              }}
            />
          </div>
          <button
            onClick={fetchProductosPorSucursal}
            disabled={loadingSucursal || !sucursalIdInput.trim()}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              fontWeight: 500,
              marginTop: "20px",
            }}
          >
            {loadingSucursal ? "Cargando..." : "Obtener productos de sucursal"}
          </button>
        </div>

        <h4>Productos de la Sucursal {sucursalIdInput}:</h4>
        {!Array.isArray(productosSucursal) || productosSucursal.length === 0 ? (
          <>
            <p>
              {Array.isArray(productosSucursal) &&
              productosSucursal.length === 0
                ? "No hay productos en esta sucursal (o el array viene vacío)."
                : "La respuesta no es una lista; inspecciona el JSON completo:"}
            </p>
            {rawResponseSucursal && (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#1e293b",
                  color: "#e2e8f0",
                  padding: 12,
                  borderRadius: 8,
                  maxHeight: 300,
                  overflow: "auto",
                  fontSize: 13,
                }}
              >
                {JSON.stringify(rawResponseSucursal, null, 2)}
              </pre>
            )}
          </>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {productosSucursal.map((prod, idx) => {
              const title =
                prod?.nombre ||
                prod?.name ||
                `Producto ${prod?.id_producto ?? prod?.id ?? idx + 1}`;
              const key =
                prod?.id_producto ??
                prod?.id ??
                `sucursal-${title}-${idx}-${Math.random()
                  .toString(36)
                  .slice(2)}`;

              return (
                <details key={key} open>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: "6px 0",
                      color: "#3b82f6",
                    }}
                    title="Click para colapsar/expandir"
                  >
                    {title} (Sucursal {sucursalIdInput})
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: "#1e293b",
                      color: "#e2e8f0",
                      padding: 12,
                      borderRadius: 8,
                      maxHeight: 300,
                      overflow: "auto",
                      fontSize: 13,
                      marginTop: 8,
                    }}
                  >
                    {JSON.stringify(prod, null, 2)}
                  </pre>
                </details>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Testing Section */}
      <h3>Test Upload Functions</h3>
      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: 8 }}
        />

        {/* Product ID Input for subirImagenesProducto */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            ID del Producto (para subirImagenesProducto):
          </label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Ingresa el ID del producto"
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              width: "200px",
              fontSize: 14,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={testUploadProductPhotos}
            disabled={uploadLoading || selectedFiles.length === 0}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            {uploadLoading ? "Subiendo..." : "Test uploadProductPhotos"}
          </button>
          <button
            onClick={testUploadProductPhotos2}
            disabled={uploadLoading || selectedFiles.length === 0}
            style={{
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            {uploadLoading ? "Subiendo..." : "Test uploadProductPhotos2"}
          </button>
          <button
            onClick={testSubirImagenesProducto}
            disabled={
              uploadLoading || selectedFiles.length === 0 || !productId.trim()
            }
            style={{
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            {uploadLoading ? "Subiendo..." : "Test subirImagenesProducto"}
          </button>
        </div>

        {/* Test actualizarProducto Section */}
        <h4>Test actualizarProducto (con subida de imágenes)</h4>
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                ID Producto:
              </label>
              <input
                type="text"
                value={updateProductData.id_producto}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    id_producto: e.target.value,
                  })
                }
                placeholder="ID del producto"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Nombre:
              </label>
              <input
                type="text"
                value={updateProductData.nombre}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    nombre: e.target.value,
                  })
                }
                placeholder="Nombre del producto"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Precio Base:
              </label>
              <input
                type="number"
                value={updateProductData.precio_base}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    precio_base: e.target.value,
                  })
                }
                placeholder="Precio base"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                ID Subcategoría:
              </label>
              <input
                type="text"
                value={updateProductData.id_subcategoria}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    id_subcategoria: e.target.value,
                  })
                }
                placeholder="ID subcategoría"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                ID Marca:
              </label>
              <input
                type="text"
                value={updateProductData.id_marca}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    id_marca: e.target.value,
                  })
                }
                placeholder="ID marca"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Unidad Medida:
              </label>
              <select
                value={updateProductData.unidad_medida}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    unidad_medida: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              >
                <option value="unidad">Unidad</option>
                <option value="libra">Libra</option>
                <option value="litro">Litro</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
            >
              Descripción:
            </label>
            <textarea
              value={updateProductData.descripcion}
              onChange={(e) =>
                setUpdateProductData({
                  ...updateProductData,
                  descripcion: e.target.value,
                })
              }
              placeholder="Descripción del producto"
              rows={3}
              style={{
                width: "100%",
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
          </div>
          <button
            onClick={testActualizarProducto}
            disabled={uploadLoading || !updateProductData.id_producto.trim()}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            {uploadLoading ? "Actualizando..." : "Test actualizarProducto"}
          </button>
        </div>

        {/* Test crearProducto Section */}
        <h4>Test crearProducto (con subida de imágenes)</h4>
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Nombre:
              </label>
              <input
                type="text"
                value={updateProductData.nombre}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    nombre: e.target.value,
                  })
                }
                placeholder="Nombre del producto"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Precio Base:
              </label>
              <input
                type="number"
                value={updateProductData.precio_base}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    precio_base: e.target.value,
                  })
                }
                placeholder="Precio base"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                ID Subcategoría:
              </label>
              <input
                type="text"
                value={updateProductData.id_subcategoria}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    id_subcategoria: e.target.value,
                  })
                }
                placeholder="ID subcategoría"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                ID Marca:
              </label>
              <input
                type="text"
                value={updateProductData.id_marca}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    id_marca: e.target.value,
                  })
                }
                placeholder="ID marca"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                Unidad Medida:
              </label>
              <select
                value={updateProductData.unidad_medida}
                onChange={(e) =>
                  setUpdateProductData({
                    ...updateProductData,
                    unidad_medida: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              >
                <option value="unidad">Unidad</option>
                <option value="libra">Libra</option>
                <option value="litro">Litro</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
            >
              Descripción:
            </label>
            <textarea
              value={updateProductData.descripcion}
              onChange={(e) =>
                setUpdateProductData({
                  ...updateProductData,
                  descripcion: e.target.value,
                })
              }
              placeholder="Descripción del producto"
              rows={3}
              style={{
                width: "100%",
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
          </div>
          <button
            onClick={testCrearProducto}
            disabled={
              uploadLoading ||
              !updateProductData.nombre.trim() ||
              !updateProductData.precio_base ||
              !updateProductData.id_subcategoria.trim() ||
              !updateProductData.id_marca.trim()
            }
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
            }}
          >
            {uploadLoading ? "Creando..." : "Test crearProducto"}
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <p>
            Archivos seleccionados:{" "}
            {selectedFiles.map((f) => f.name).join(", ")}
          </p>
        )}
        {productId && <p>ID del producto: {productId}</p>}
      </div>

      {/* Upload Response */}
      {uploadResponse && (
        <div style={{ marginBottom: 24 }}>
          <h4>Respuesta del Upload:</h4>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#2d3748",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 8,
              maxHeight: 300,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {JSON.stringify(uploadResponse, null, 2)}
          </pre>
        </div>
      )}

      <h3>Todos los Productos:</h3>

      {/* Si la API no devolvió un array, mostramos el crudo completo para que veas todo */}
      {!Array.isArray(products) || products.length === 0 ? (
        <>
          <p>
            {Array.isArray(products) && products.length === 0
              ? "No hay productos cargados (o el array viene vacío)."
              : "La respuesta no es una lista; inspecciona el JSON completo:"}
          </p>
          {rawResponse && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#111",
                color: "#eee",
                padding: 12,
                borderRadius: 8,
                maxHeight: 480,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {products.map((prod, idx) => {
            const title =
              prod?.nombre ||
              prod?.name ||
              `Producto ${prod?.id_producto ?? prod?.id ?? idx + 1}`;
            const key =
              prod?.id_producto ??
              prod?.id ??
              `${title}-${idx}-${Math.random().toString(36).slice(2)}`;

            return (
              <details key={key} open>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: "6px 0",
                  }}
                  title="Click para colapsar/expandir"
                >
                  {title}
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    padding: 12,
                    borderRadius: 8,
                    maxHeight: 480,
                    overflow: "auto",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {JSON.stringify(prod, null, 2)}
                </pre>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

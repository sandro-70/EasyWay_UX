import React, { Component } from "react";

class TablaProductos extends Component {
  state = {
    barraTop: 48 // posición inicial debajo del encabezado en px
  };

  handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = this.state.barraTop;

    const { productos = [] } = this.props;
    const alturaFila = 40; // altura aproximada de cada fila en px
    const totalAlturaProductos = productos.length * alturaFila;
    const minTop = 48; // justo debajo del encabezado
    const maxTop = minTop + totalAlturaProductos - 20; // antes de la línea final, 20px es altura de la barra

    const handleMouseMove = (eMove) => {
      let newTop = startTop + (eMove.clientY - startY);
      // Limitar dentro del área de productos
      if (newTop < minTop) newTop = minTop;
      if (newTop > maxTop) newTop = maxTop;
      this.setState({ barraTop: newTop });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  render() {
    const { productos = [] } = this.props;

    const productosValidos = productos.filter(
      (prod) =>
        prod &&
        prod.nombre &&
        prod.nombre.toString().trim() !== "" &&
        !isNaN(Number(prod.cantidad)) &&
        !isNaN(Number(prod.precio))
    );

    if (!productosValidos.length) return null;

    return (
      <div style={{ position: "relative" }}>
        <table
          className="w-full text-sm border-collapse"
          style={{
            borderLeft: "1px solid #cccccc",
            borderRight: "1px solid #cccccc",
          }}
        >
          <thead>
            <tr>
              {["Código", "Producto", "Cantidad", "Precio unitario", "Subtotal"].map(
                (titulo, i) => (
                  <th
                    key={i}
                    className="px-2 py-1 text-white relative"
                    style={{ backgroundColor: "#2B6DAF", textAlign: "center" }}
                  >
                    {titulo}
                    {i < 4 && (
                      <div
                        className="absolute top-1/4 bottom-1/4 right-0 w-[1px] bg-white"
                      ></div>
                    )}
                  </th>
                )
              )}
            </tr>
          </thead>

          {/* Barra vertical movible */}
          <div
            onMouseDown={this.handleMouseDown}
            style={{
              position: "absolute",
              top: this.state.barraTop,
              left: "8px",
              width: "4px",
              height: "20px",
              backgroundColor: "#cccccc",
              cursor: "ns-resize",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          ></div>

          <tbody>
            {productosValidos.map((prod, index) => (
              <tr key={index} style={{ textAlign: "center" }}>
                <td className="px-2 py-1" style={{ border: "none", textAlign: "center" }}>
                  {prod.codigo || "0001"}
                </td>
                <td className="px-2 py-1" style={{ border: "none", textAlign: "center" }}>
                  {prod.nombre}
                </td>
                <td className="px-2 py-1" style={{ border: "none", textAlign: "center" }}>
                  x{prod.cantidad}
                </td>
                <td className="px-2 py-1" style={{ border: "none", textAlign: "center" }}>
                  Lps. {Number(prod.precio).toFixed(2)}
                </td>
                <td className="px-2 py-1" style={{ border: "none", textAlign: "center" }}>
                  Lps. {(Number(prod.cantidad) * Number(prod.precio)).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Línea gris final un poco subida */}
            <tr>
              <td
                colSpan={5}
                style={{
                  borderTop: "1px solid #cccccc",
                  padding: 0,
                  transform: "translateY(-2px)"
                }}
              ></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default TablaProductos;

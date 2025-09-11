import axios from 'axios';
import axiosInstance from './axiosInstance';

export function AddNewCarrito(id_producto, cantidad_unidad_medida){
    try {
        return axiosInstance.post("/api/carrito/agregar",{id_producto, cantidad_unidad_medida})
    }catch (error) {
        return Promise.reject(new Error('Faltan datos obligatorios'));
    }
}

export function ViewCar (){
    try{
        return axiosInstance.get("/api/carrito")
    }catch(error){
        return Promise.reject(new Error('Faltan datos obligatorios'));
    }
}

export function SumarItem(id_producto, cantidad){
    try{
        return axiosInstance.put("/api/carrito/sumar",{id_producto, cantidad})
    }catch(error){
        return Promise.reject(new Error('Faltan datos obligatorios'));
    }
}

// CarritoApi.js
export function aplicarCupon({ codigo}) {
  return axiosInstance.post('/api/carrito/cupon', { codigo });
}

export function eliminarItem({ id_producto }) {
  return axiosInstance.delete('/api/carrito/item', {
    data: { id_producto },                      // 👈 body en DELETE
    headers: { 'Content-Type': 'application/json' }
  });
}
import { t } from "i18next";
import { Link } from "react-router-dom";
export default function PerfilSidebar() {
  return (
    <div className="w-64 bg-white shadow-md p-4 rounded-xl fixed top-32 left-0 h-[calc(100vh-64px)] z-20">
      <h2 className="text-lg font-semibold mb-4">Mi cuenta</h2>
      <ul className="space-y-2">
        <li>
          <Link
            to="/miPerfil"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.editProfile")}
          </Link>
        </li>
        <li>
          <Link
            to="/misPedidos"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.myOrders")}
          </Link>
        </li>
        <li>
          <Link
            to="/metodoPago"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.myPaymentMethods")}
          </Link>
        </li>

        <li>
          <Link
            to="/misDirecciones"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.myAddresses")}
          </Link>
        </li>
        <li>
          <Link
            to="/misCupones"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.myCoupons")}
          </Link>
        </li>
        <li>
          <Link
            to="/facturas"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.myInvoices")}
          </Link>
        </li>
        <li>
          <Link
            to="/ListaDeDeseos"
            className="block p-2 rounded hover:bg-[#f0833e] text-gray-700"
          >
            {t("perfil.wishlist")}
          </Link>
        </li>
      </ul>
    </div>
  );
}

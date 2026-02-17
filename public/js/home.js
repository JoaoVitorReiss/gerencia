import { login } from  "./tela_login.js";

const btn_flogin = document.getElementById("btn_flogin");

btn_flogin.addEventListener("click", (evt) => {
    evt.preventDefault();
    login.tela_log();
});

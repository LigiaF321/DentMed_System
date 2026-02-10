function generateTemporaryPassword(length = 10) {
  // mezcla letras + números (sin caracteres raros para evitar problemas)
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

module.exports = { generateTemporaryPassword };


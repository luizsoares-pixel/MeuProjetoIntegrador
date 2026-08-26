const { supabase } = require("../lib/supabase");

async function authenticate(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Token de acesso ausente." });
  }

  const accessToken = authorization.slice("Bearer ".length);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return response.status(401).json({ error: "Token de acesso inválido ou expirado." });
  }

  request.user = {
    id: user.id,
    email: user.email,
  };

  return next();
}

module.exports = { authenticate };
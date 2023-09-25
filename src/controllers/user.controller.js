const login = async (req, res) => {
 
};

const verifySignature = async (req, res) => {
  
};

const logout = async (_, res) => {

};

const getUsers = async (_, res) => {
 console.log("getUsers")
 res.send({ data: 1234 })
};

module.exports = {
  login,
  verifySignature,
  logout,
  getUsers,
};
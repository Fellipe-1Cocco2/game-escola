const express = require('express');
const router = express.Router();
// Importa TODAS as funções do adminController agora
const {
    getAllAlunos,
    getAllProfessors,
    createSchool,
    getAllSchools,
    updateSchool,
    deleteSchool,
    createAdmin,
    getAllAdmins,
    getSchoolDetails // Importa a nova função
    // Importar outras funções CRUD aqui depois
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authAdminMiddleware'); // Importa o middleware de proteção ADMIN

// --- APLICA O MIDDLEWARE DE PROTEÇÃO ADMIN A TODAS AS ROTAS ABAIXO ---
router.use(protectAdmin); // !!! IMPORTANTE !!!

// --- Rotas Antigas (agora protegidas) ---
router.get('/professors', getAllProfessors);
router.get('/alunos', getAllAlunos);

// --- Rotas CRUD para Escolas ---
router.route('/schools')
    .post(createSchool)
    .get(getAllSchools);

router.route('/schools/:schoolId')
    .put(updateSchool)
    .delete(deleteSchool);

// --- NOVA ROTA DE DETALHES DA ESCOLA ---
router.get('/schools/:schoolId/details', getSchoolDetails); // Rota para buscar detalhes completos

// --- Rotas CRUD para Administradores ---
router.route('/admins')
    .post(createAdmin)
    .get(getAllAdmins);

// --- Rotas Futuras ---
// router.put('/salas/:salaId', updateSalaByAdmin); // Exemplo futuro
// router.get('/salas/:salaId/details', getSalaDetailsByAdmin); // Exemplo futuro

module.exports = router;


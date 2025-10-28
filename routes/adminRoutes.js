const express = require('express');
const router = express.Router();
// Importa TODAS as funções do adminController
const {
    getAllAlunos, // Mantém
    getAllProfessors, // Mantém
    createSchool, // Mantém
    getAllSchools, // Mantém
    updateSchool, // Mantém
    deleteSchool, // Mantém
    createAdmin, // Mantém
    getAllAdmins, // Mantém
    getSchoolDetails, // Mantém

    // --- NOVAS FUNÇÕES ---
    // Professor
    getProfessorByIdAdmin,
    updateProfessorAdmin,
    deleteProfessorAdmin,
    // Sala (Admin perspective)
    getSalaByIdAdmin,
    updateSalaAdmin, // Renomear, talvez outras configs
    addCollaboratorAdmin,
    removeCollaboratorAdmin,
    // Tarefa (Admin perspective)
    getTarefaByIdAdmin,
    updateTarefaAdmin,
    removePerguntaFromTarefaAdmin,
    deleteTarefaAdmin, // Excluir tarefa inteira
    // Aluno (Admin perspective)
    getAlunoByIdAdmin,
    updateAlunoAdmin,
    moveAlunoAdmin, // Mover aluno entre salas
    deleteAlunoAdmin, // Excluir aluno do sistema (cuidado!)
    // Pergunta (Banco de Dados)
    getAllPerguntasAdmin, // Listar todas para gerenciar
    getPerguntaByIdAdmin,
    updatePerguntaAdmin,
    deletePerguntaAdmin

} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authAdminMiddleware'); // Middleware ADMIN

// Aplica proteção a TODAS as rotas abaixo
router.use(protectAdmin); // !!! IMPORTANTE !!!

// --- Rotas Antigas (agora protegidas) ---
// (Manter /professors, /alunos, /schools, /admins, /schools/:schoolId/details)
router.get('/professors', getAllProfessors);
router.get('/alunos', getAllAlunos); // Lista geral de alunos

router.route('/schools')
    .post(createSchool)
    .get(getAllSchools);
router.route('/schools/:schoolId')
    .put(updateSchool)
    .delete(deleteSchool);
router.get('/schools/:schoolId/details', getSchoolDetails);

router.route('/admins')
    .post(createAdmin)
    .get(getAllAdmins);
// TODO: Adicionar rotas PUT e DELETE para /admins/:adminId se necessário

// --- NOVAS ROTAS CRUD (ADMIN) ---

// Professores (CRUD completo pelo Admin)
router.route('/professors/:professorId')
    .get(getProfessorByIdAdmin) // Ver detalhes de um professor
    .put(updateProfessorAdmin) // Atualizar nome, email, senha
    .delete(deleteProfessorAdmin); // Excluir professor

// Salas (Visão e Edição pelo Admin)
router.route('/salas/:salaId')
    .get(getSalaByIdAdmin) // Ver detalhes da sala (incluindo tarefas, alunos, colaboradores)
    .put(updateSalaAdmin); // Atualizar nome da sala
// Gerenciar Colaboradores da Sala
router.post('/salas/:salaId/collaborators', addCollaboratorAdmin); // Adicionar colaborador por email
router.delete('/salas/:salaId/collaborators/:professorId', removeCollaboratorAdmin); // Remover colaborador

// Tarefas (Visão e Edição pelo Admin)
router.route('/salas/:salaId/tarefas/:tarefaId')
    .get(getTarefaByIdAdmin) // Ver detalhes da tarefa (perguntas, resultados)
    .put(updateTarefaAdmin) // Atualizar título, data/hora
    .delete(deleteTarefaAdmin); // Excluir a tarefa da sala
// Gerenciar Perguntas DENTRO de uma Tarefa
router.delete('/salas/:salaId/tarefas/:tarefaId/perguntas/:perguntaId', removePerguntaFromTarefaAdmin);

// Alunos (Visão e Edição pelo Admin)
router.route('/alunos/:alunoId')
    .get(getAlunoByIdAdmin) // Ver detalhes do aluno
    .put(updateAlunoAdmin) // Atualizar nome, RA
    .delete(deleteAlunoAdmin); // Excluir aluno do SISTEMA (ação drástica!)
// Mover Aluno
router.put('/alunos/:alunoId/move', moveAlunoAdmin); // Precisa do ID da nova sala no body

// Perguntas (Gerenciamento do Banco de Perguntas pelo Admin)
router.route('/perguntas')
     .get(getAllPerguntasAdmin); // Listar todas as perguntas do banco
router.route('/perguntas/:perguntaId')
    .get(getPerguntaByIdAdmin) // Ver detalhes de uma pergunta
    .put(updatePerguntaAdmin) // Atualizar texto, opções, resposta correta
    .delete(deletePerguntaAdmin); // Excluir pergunta do BANCO (cuidado!)

module.exports = router;
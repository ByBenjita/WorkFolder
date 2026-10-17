// /api/documentos usa el mismo proxy que /api/documentos/* ([...path] exige al menos un segmento)
export { GET, POST, DELETE, PATCH } from './[...path]/route';

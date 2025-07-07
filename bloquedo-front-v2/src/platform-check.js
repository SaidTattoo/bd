// Este archivo verifica si el entorno es browser o server
console.log('Verificando entorno:');
console.log('- window exists:', typeof window !== 'undefined');
console.log('- document exists:', typeof document !== 'undefined');
console.log('- navigator exists:', typeof navigator !== 'undefined');
console.log('- localStorage exists:', typeof localStorage !== 'undefined');

// Forzar el modo browser si estamos detectando incorrectamente
if (typeof window !== 'undefined') {
  window.forceClientMode = true;
  console.log('Modo cliente forzado activado');
} 
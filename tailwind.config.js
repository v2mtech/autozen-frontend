/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de Cores da Interface (Tema Claro)
        'fundo': {
          'principal': '#f5f7f8', // Um cinza muito claro para o fundo principal
          'secundario': '#ffffff', // Branco puro para cards e painéis
        },
        'texto': {
          'principal': '#00191d', // O mais escuro para texto principal de alta legibilidade
          'secundario': '#426368', // Um tom médio para texto secundário
        },
        'primaria': {
          'padrao': '#63888e',      // Cor principal para botões e links
          'intermediario': '#84adb4',  // Cor mais clara para hover
          'escuro': '#426368',      // Cor mais escura para estados ativos/focados
        },
        'borda': '#e0e6e8', // Cor suave para bordas e divisórias
        'erro': '#d9534f', // Um vermelho padrão para mensagens de erro

        // Cores do layout de autenticação remapeadas para o tema claro
        'auth-card': '#ffffff',
        'auth-bg': '#f5f7f8',
        'auth-wave': '#d1d9db',
        'auth-button': '#426368',
        'auth-button-hover': '#63888e',
        'auth-text-dark': '#00191d',
        'auth-text-light': '#63888e',
        'auth-border': '#d1d9db',
      }
    },
  },
  plugins: [],
}
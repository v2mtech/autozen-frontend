/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'auth-bg': '#fdf6f3', // Um branco rosado muito claro para o fundo
        'auth-card': '#ffffff',
        'auth-wave': '#f8dac2', // Cor da onda e elementos principais
        'auth-text-dark': '#142738',
        'auth-text-light': '#5f6c7b',
        'auth-button': '#f4436f',
        'auth-button-hover': '#ca1444',
        'auth-border': '#fdece7',
        // --- NOVAS CORES SEMÂNTICAS (LIGHT MODE) ---
        'fundo-principal': '#FFFFFF', // Fundo principal branco
        'fundo-secundario': '#F7FAFC', // Um cinza muito claro para contraste sutil
        'texto-principal': '#142738', // Cor de texto mais escura da paleta
        'texto-secundario': '#4A5568', // Um cinza escuro para textos de apoio
        'primaria-claro': '#f8dac2',
        'primaria-intermediario': '#f2a297',
        'primaria-padrao': '#f4436f',
        'primaria-escuro': '#ca1444',
        'borda': '#E2E8F0', // Cor para bordas sutis
        'erro': '#ca1444',

        // --- CORES GENÉRICAS (MANTIDAS PARA COMPATIBILIDADE) ---
        'white': '#FFFFFF',
        'gray-900': '#1a202c',
        'gray-800': '#2d3748',
        'gray-700': '#e6eaf1ff',
        'gray-600': '#718096',
        'gray-500': '#5e6268ff',
        'gray-400': '#39393aff',
        'gray-300': '#2b2b2cff',
        'gray-200': '#edf2f7',
        'gray-100': '#f7fafc',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
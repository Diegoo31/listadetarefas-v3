/**
 * Efeitos espaciais para o tema de planetas
 * Adiciona animações interativas de estrelas e meteoros
 */

document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estrelas
    const starsContainer = document.getElementById('stars');
    const numStars = 150; // Mais estrelas
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        
        // Tamanhos variados de estrelas
        const size = 1 + Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Brilho variável
        const brightness = 0.5 + Math.random() * 0.5;
        star.style.opacity = brightness;
        
        starsContainer.appendChild(star);
    }
    
    // Animar meteoros
    function createMeteors() {
        const meteor1 = document.getElementById('meteor1');
        const meteor2 = document.getElementById('meteor2');
        
        function animateMeteor(meteor) {
            // Posição inicial aleatória no topo da tela
            const startX = 20 + Math.random() * 80; // % da largura da tela
            meteor.style.left = `${startX}%`;
            meteor.style.top = '-50px';
            meteor.style.opacity = '0';
            
            // Determinar tamanho aleatório do meteoro
            const size = 2 + Math.random() * 3;
            const length = 30 + Math.random() * 50;
            meteor.style.width = `${size}px`;
            meteor.style.height = `${length}px`;
            
            // Animação de aparecimento e movimento
            setTimeout(() => {
                meteor.style.opacity = '1';
                meteor.style.transform = 'translateX(-300px) translateY(700px) rotate(45deg)';
                meteor.style.transition = 'transform 2s linear, opacity 2s linear';
                
                // Desaparecer no final da animação
                setTimeout(() => {
                    meteor.style.opacity = '0';
                    
                    // Resetar posição após a animação
                    setTimeout(() => {
                        meteor.style.transition = 'none';
                        meteor.style.transform = 'translateX(0) translateY(0) rotate(45deg)';
                    }, 100);
                    
                }, 1000);
            }, 100);
        }
        
        // Ativar meteoros em intervalos aleatórios
        setInterval(() => animateMeteor(meteor1), 5000 + Math.random() * 3000);
        setInterval(() => animateMeteor(meteor2), 8000 + Math.random() * 5000);
        
        // Iniciar imediatamente
        setTimeout(() => animateMeteor(meteor1), 1000);
        setTimeout(() => animateMeteor(meteor2), 3000);
    }
    
    createMeteors();
    
    // Efeito parallax simples no movimento do mouse
    document.addEventListener('mousemove', function(e) {
        const moveX = (e.clientX - window.innerWidth / 2) / 100;
        const moveY = (e.clientY - window.innerHeight / 2) / 100;
        
        // Mover o planeta principal mais lentamente (parallax)
        const planet = document.querySelector('.planet');
        const planetRing = document.querySelector('.planet-ring');
        const smallPlanet = document.querySelector('.small-planet');
        
        if (planet && planetRing && smallPlanet) {
            planet.style.transform = `translate(${moveX * -3}px, ${moveY * -3}px)`;
            planetRing.style.transform = `rotate(-30deg) translate(${moveX * -2}px, ${moveY * -2}px)`;
            smallPlanet.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
        }
    });
}); 
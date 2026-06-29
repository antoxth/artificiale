// Javascript per il sito "Artificiale sarà lei"

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Menu Mobile (Burger Menu)
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = burgerMenu.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
        
        // Chiudi il menu quando si clicca su un link o bottone
        const menuLinks = document.querySelectorAll('.nav-menu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = burgerMenu.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }

    // 2. Active Link on Scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 3. Accordion (Gli 11 Capitoli)
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const content = this.nextElementSibling;
            const isActive = item.classList.contains('active');
            
            // Chiudi tutti gli altri elementi
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-content').style.maxHeight = null;
            });
            
            // Se l'elemento non era già attivo, aprilo
            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // 4. Modal Video Trailer
    const playBtn = document.getElementById('playBtn');
    const videoModal = document.getElementById('videoModal');
    const closeModal = document.getElementById('closeModal');
    const modalIframe = document.getElementById('modalIframe');
    const originalSrc = modalIframe ? modalIframe.src : '';

    if (playBtn && videoModal && closeModal) {
        playBtn.addEventListener('click', () => {
            videoModal.classList.add('active');
            if (modalIframe) {
                // Avvia il video in autoplay
                modalIframe.src = originalSrc;
            }
        });

        const closeFunc = () => {
            videoModal.classList.remove('active');
            if (modalIframe) {
                // Ferma il video svuotando il src
                modalIframe.src = '';
            }
        };

        closeModal.addEventListener('click', closeFunc);
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeFunc();
            }
        });
    }    // 5. Playlist Musica IA e Player Audio Reale
    const songCards = document.querySelectorAll('.song-card');
    const globalPlayer = document.getElementById('globalPlayer');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const progressBar = document.getElementById('progressBar');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const visualizerBars = document.querySelectorAll('#visualizer .bar');

    // Mappatura dei brani reali presenti in assets/audio/
    const trackList = {
        '1': { title: 'Amor che a nullo amato amar perdona', file: 'assets/audio/amor-che-a-nullo-amato-amar-perdona.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '2': { title: 'Come sono intelligente', file: 'assets/audio/come-sono-intelligente.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '3': { title: 'Amore mio, bella senz’anima', file: 'assets/audio/fuori-testo-amore-mio-bella-senz-anima.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '4': { title: 'Ho un cervello poco intelligente', file: 'assets/audio/ho-un-cervello-poco-intelligente.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '5': { title: 'Il tuo amore è un fuoco di paglia', file: 'assets/audio/il-tuo-amore-e-un-fuoco-di-paglia.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '6': { title: 'Io faccio un bel mestiere', file: 'assets/audio/io-faccio-un-bel-mestiere-ufficiale.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '7': { title: "It's only business, bro", file: 'assets/audio/it-s-only-business-bro-bis.mp3', artist: 'Intelligenza Artificiale (Clara)' },
        '8': { title: "Ma come ragioni, bro', sei fuori di testa", file: 'assets/audio/ma-come-ragioni-bro-sei-fuori-di-test.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '9': { title: 'Miliardi di neuroni', file: 'assets/audio/miliardi-di-neuroni.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '10': { title: 'Se ti dico "Cosa hai in testa?"', file: 'assets/audio/se-ti-dico-cosa-hai-in-testa.wav', artist: 'Intelligenza Artificiale (Clara)' },
        '11': { title: 'Ti prego, parlami ancora', file: 'assets/audio/ti-prego-parlami-ancora.wav', artist: 'Intelligenza Artificiale (Clara)' }
    };

    let audio = new Audio();
    let currentTrackId = null;
    let audioCtx = null;
    let analyser = null;
    let source = null;
    let animationFrameId = null;
    let visualizerDataArray = new Uint8Array(16);

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function initWebAudio() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 32;
                source = audioCtx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
            } catch (e) {
                console.warn("Web Audio API non supportata o bloccata:", e);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function updateVisualizer() {
        if (!globalPlayer.classList.contains('playing')) {
            visualizerBars.forEach(bar => bar.style.height = '4px');
            return;
        }

        animationFrameId = requestAnimationFrame(updateVisualizer);

        if (analyser) {
            analyser.getByteFrequencyData(visualizerDataArray);
            visualizerBars.forEach((bar, idx) => {
                const val = visualizerDataArray[idx % 8] || 0;
                const height = 4 + (val / 255) * 24;
                bar.style.height = `${height}px`;
            });
        } else {
            // Fallback procedurale se l'analizzatore non è disponibile
            visualizerBars.forEach(bar => {
                const height = 4 + Math.random() * 24;
                bar.style.height = `${height}px`;
            });
        }
    }

    function stopPlayback() {
        audio.pause();
        if (globalPlayer) {
            globalPlayer.classList.remove('playing');
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        visualizerBars.forEach(bar => bar.style.height = '4px');
        songCards.forEach(card => {
            card.classList.remove('playing');
            card.querySelector('.song-play-btn i').className = 'fa-solid fa-play';
        });
    }

    function playTrack(trackId) {
        const track = trackList[trackId];
        if (!track) return;

        if (currentTrackId === trackId) {
            if (audio.paused) {
                initWebAudio();
                audio.play();
                globalPlayer.classList.add('playing');
                updateVisualizer();
                const card = document.querySelector(`.song-card[data-track="${trackId}"]`);
                if (card) {
                    card.classList.add('playing');
                    card.querySelector('.song-play-btn i').className = 'fa-solid fa-pause';
                }
            } else {
                stopPlayback();
            }
            return;
        }

        stopPlayback();
        currentTrackId = trackId;

        // Attiva il player globale
        globalPlayer.classList.add('active');
        globalPlayer.classList.add('playing');

        // Imposta info traccia
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.artist;

        const card = document.querySelector(`.song-card[data-track="${trackId}"]`);
        if (card) {
            card.classList.add('playing');
            card.querySelector('.song-play-btn i').className = 'fa-solid fa-pause';
        }

        audio.src = track.file;
        initWebAudio();
        
        audio.play().then(() => {
            updateVisualizer();
        }).catch(err => {
            console.error("Errore di riproduzione audio:", err);
            stopPlayback();
        });
    }

    // Gestione degli eventi dell'elemento Audio
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${pct}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        stopPlayback();
        currentTrackId = null;
    });

    // Event Listener per i tasti Play/Pause nelle card
    songCards.forEach(card => {
        const playBtn = card.querySelector('.song-play-btn');
        const trackId = card.getAttribute('data-track');

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(trackId);
        });
    });

    // Gestione del click sulla barra di progresso
    if (progressBarContainer) {
        progressBarContainer.addEventListener('click', function(e) {
            if (!currentTrackId || isNaN(audio.duration)) return;
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const pct = clickX / width;
            audio.currentTime = pct * audio.duration;
        });
    }

    // 6. Invio Form di Contatto (Simulazione)
    const bookingForm = document.getElementById('bookingForm');
    const successMessage = document.getElementById('successMessage');

    if (bookingForm && successMessage) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Invio in corso...';
            
            const formData = {
                "Nome Referente": document.getElementById('fullName').value,
                "Ruolo": document.getElementById('role').value,
                "Istituto": document.getElementById('schoolName').value,
                "Email": document.getElementById('email').value,
                "Telefono": document.getElementById('phone').value,
                "Tipo Richiesta": document.getElementById('requestType').value,
                "Note": document.getElementById('notes').value
            };
            
            fetch('https://formsubmit.co/ajax/antoniocolucciph@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Errore durante l\'invio');
                }
            })
            .then(data => {
                bookingForm.style.opacity = '0';
                setTimeout(() => {
                    bookingForm.style.display = 'none';
                    successMessage.style.display = 'flex';
                }, 300);
            })
            .catch(error => {
                alert('Si è verificato un errore durante l\'invio. Ti invitiamo a riprovare o ad inviare una mail direttamente a info@teatro99posti.com.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }

    // 7. Galleria Fotografica (Slider)
    const galleryTrack = document.getElementById('galleryTrack');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    const dotsContainer = document.getElementById('galleryDots');
    const slides = document.querySelectorAll('.slider-track .slide');
    
    if (galleryTrack && prevBtn && nextBtn && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;
        
        function getSlidesVisible() {
            if (window.innerWidth <= 600) return 1;
            if (window.innerWidth <= 992) return 2;
            return 3;
        }
        
        function updateSlider() {
            const visible = getSlidesVisible();
            const maxIndex = totalSlides - visible;
            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;
            
            const slideWidth = 100 / visible;
            galleryTrack.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
            
            const dots = document.querySelectorAll('.slider-dots .dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        }
        
        function createDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const visible = getSlidesVisible();
            const maxIndex = totalSlides - visible + 1;
            
            for (let i = 0; i < maxIndex; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateSlider();
                });
                dotsContainer.appendChild(dot);
            }
        }
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
            } else {
                currentIndex = totalSlides - getSlidesVisible();
            }
            updateSlider();
        });
        
        nextBtn.addEventListener('click', () => {
            const maxIndex = totalSlides - getSlidesVisible();
            if (currentIndex < maxIndex) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            updateSlider();
        });
        
        let autoSlide = setInterval(() => {
            const maxIndex = totalSlides - getSlidesVisible();
            if (currentIndex < maxIndex) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            updateSlider();
        }, 4000);
        
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlide));
            sliderContainer.addEventListener('mouseleave', () => {
                clearInterval(autoSlide);
                autoSlide = setInterval(() => {
                    const maxIndex = totalSlides - getSlidesVisible();
                    if (currentIndex < maxIndex) {
                        currentIndex++;
                    } else {
                        currentIndex = 0;
                    }
                    updateSlider();
                }, 4000);
            });
        }
        
        window.addEventListener('resize', () => {
            createDots();
            updateSlider();
        });
        
        createDots();
        updateSlider();
    }

    // 8. Lightbox per la Galleria
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
    const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
    const lightboxNextBtn = document.getElementById('lightboxNextBtn');
    
    if (lightbox && lightboxImg && slides.length > 0) {
        const imageElements = Array.from(document.querySelectorAll('.slider-track .slide img'));
        const imageUrls = imageElements.map(img => img.src);
        let lightboxIndex = 0;
        
        function openLightbox(index) {
            lightboxIndex = index;
            lightboxImg.src = imageUrls[lightboxIndex];
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        
        function showNextImage() {
            lightboxIndex = (lightboxIndex + 1) % imageUrls.length;
            lightboxImg.src = imageUrls[lightboxIndex];
        }
        
        function showPrevImage() {
            lightboxIndex = (lightboxIndex - 1 + imageUrls.length) % imageUrls.length;
            lightboxImg.src = imageUrls[lightboxIndex];
        }
        
        imageElements.forEach((img, idx) => {
            img.addEventListener('click', () => {
                openLightbox(idx);
            });
        });
        
        if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
        if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);
        if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            }
        });
    }
});

function FramePlayer(canvasId, framePrefix, frameCount) {
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext('2d', {
        alpha: true
    });
    ctx.imageSmoothingEnabled = false;
    var frames = [];
    var frameIdx = 0;
    var accum = 0;
    var lastTime = 0;
    var playing = false;
    var speed = 0.5
    var loadedCount = 0;
    var baseDelay = 100; // 10 FPS base speed

    this.setSpeed = function(s) {
        speed = s;
    };

    this.setVisible = function(v) {
        canvas.style.display = v ? '' : 'none';
    };

    for (var i = 1; i <= frameCount; i++) {
        var img = new Image();
        img.onload = function() {
            loadedCount++;
            if (loadedCount === 1) {
                canvas.width = this.width;
                canvas.height = this.height;
            }
            if (loadedCount === frameCount && !playing) {
                playing = true;
                lastTime = performance.now();
                requestAnimationFrame(tick);
            }
        };
        img.src = framePrefix + i + '.png';
        frames.push({
            img: img
        });
    }

    function tick(now) {
        if (!playing) {
            requestAnimationFrame(tick);
            return;
        }
        var dt = now - lastTime;
        lastTime = now;
        // Cap dt to prevent huge jumps if tab was inactive
        if (dt > 1000) dt = 16;
        accum += dt * speed;
        while (accum >= baseDelay) {
            accum -= baseDelay;
            frameIdx = (frameIdx + 1) % frames.length;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (frames[frameIdx].img.complete && frames[frameIdx].img.naturalWidth > 0) {
            ctx.drawImage(frames[frameIdx].img, 0, 0);
        }
        requestAnimationFrame(tick);
    }
}

// ===== INIT =====
var playerBase = new FramePlayer('gif-base', 'assets/images/frames/bg/spr_shop', 5);
var playerOry = new FramePlayer('gif-ory', 'assets/images/frames/ory/spr_shop', 5);

// ===== LOCALIZATION =====
var i18n = {
    en: {
        settings: 'Settings',
        ory: 'Ory',
        music: 'Music',
        volume: 'Volume',
        speed: 'Animation Speed'
    },
    pt: {
        settings: 'Configurações',
        ory: 'Laranja',
        music: 'Música',
        volume: 'Volume',
        speed: 'Velocidade Anim'
    },
    es: {
        settings: 'Ajustes',
        ory: 'Ory',
        music: 'Música',
        volume: 'Volumen',
        speed: 'Velocidad Anim'
    }
};

var lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
var currentLang = lang.startsWith('pt') ? 'pt' : lang.startsWith('es') ? 'es' : 'en';

document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var t = i18n[currentLang] || i18n.en;
    var key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
});

// ===== CONTROLS =====
var audio = document.getElementById('bgm');
var toggleOry = document.getElementById('toggle-ory');
var toggleMus = document.getElementById('toggle-music');
var volSlider = document.getElementById('vol-slider');
var volVal = document.getElementById('vol-val');
var volIcon = document.getElementById('vol-icon');
var speedSlider = document.getElementById('speed-slider');
var speedVal = document.getElementById('speed-val');
var gearBtn = document.getElementById('gear-btn');
var controls = document.getElementById('controls');
var prevVolume = 0.5;
var panelOpen = false;

audio.volume = 0.5;
var gifSpeed = 0.5;

toggleOry.addEventListener('change', function() {
    playerOry.setVisible(this.checked);
    saveSettings();
});

toggleMus.addEventListener('change', function() {
    if (this.checked) audio.play().catch(function() {});
    else audio.pause();
    saveSettings();
});

function setVolume(v) {
    v = Math.max(0, Math.min(1, v));
    audio.volume = v;
    volSlider.value = Math.round(v * 100);
    volVal.textContent = Math.round(v * 100) + '%';
    volIcon.innerHTML = v === 0 ? '&#128264;' : v < 0.5 ? '&#128265;' : '&#128266;';
}

volSlider.addEventListener('input', function() {
    setVolume(this.value / 100);
    toggleMus.checked = audio.volume > 0;
    saveSettings();
});

volIcon.addEventListener('click', function() {
    if (audio.volume > 0) {
        prevVolume = audio.volume;
        setVolume(0);
        toggleMus.checked = false;
    } else {
        setVolume(prevVolume || 0.5);
        toggleMus.checked = true;
        audio.play().catch(function() {});
    }
    saveSettings();
});

speedSlider.addEventListener('input', function() {
    gifSpeed = this.value / 100;
    speedVal.textContent = gifSpeed.toFixed(1) + 'x';
    playerBase.setSpeed(gifSpeed);
    playerOry.setSpeed(gifSpeed);
    saveSettings();
});

gearBtn.addEventListener('click', function() {
    panelOpen = !panelOpen;
    controls.classList.toggle('visible', panelOpen);
    if (panelOpen) gearBtn.style.display = 'none';
});

controls.addEventListener('mouseleave', function() {
    if (panelOpen) {
        panelOpen = false;
        controls.classList.remove('visible');
        setTimeout(function() {
            gearBtn.style.display = '';
        }, 100);
    }
});

var hideTimer;

function showGear() {
    gearBtn.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function() {
        gearBtn.classList.remove('visible');
        if (panelOpen) {
            panelOpen = false;
            controls.classList.remove('visible');
        }
    }, 3000);
}

document.addEventListener('mousemove', showGear);
document.addEventListener('click', showGear);

function saveSettings() {
    try {
        localStorage.setItem('shop_ch5_ory', toggleOry.checked ? 1 : 0);
        localStorage.setItem('shop_ch5_music', toggleMus.checked ? 1 : 0);
        localStorage.setItem('shop_ch5_vol', audio.volume);
        localStorage.setItem('shop_ch5_speed', gifSpeed);
    } catch (e) {}
}

function loadSettings() {
    try {
        var o = localStorage.getItem('shop_ch5_ory');
        var m = localStorage.getItem('shop_ch5_music');
        var v = localStorage.getItem('shop_ch5_vol');
        var s = localStorage.getItem('shop_ch5_speed');
        if (o !== null) {
            toggleOry.checked = o === '1';
            playerOry.setVisible(toggleOry.checked);
        }
        if (v !== null) setVolume(parseFloat(v));
        if (m !== null) {
            toggleMus.checked = m === '1';
            if (!toggleMus.checked) audio.pause();
        }
        if (s !== null) {
            gifSpeed = parseFloat(s);
            speedSlider.value = Math.round(gifSpeed * 100);
            speedVal.textContent = gifSpeed.toFixed(1) + 'x';
            playerBase.setSpeed(gifSpeed);
            playerOry.setSpeed(gifSpeed);
        }
    } catch (e) {}
}

loadSettings();

function tryPlay() {
    if (toggleMus.checked) audio.play().catch(function() {});
    document.removeEventListener('click', tryPlay);
}

document.addEventListener('click', tryPlay);

function applyProperty(name, val) {
    if (name === 'hide_gear_btn') {
        if (val) {
            gearBtn.style.display = 'none';
        } else {
            gearBtn.style.display = '';
        }
    } else if (name === 'ory_enabled') {
        toggleOry.checked = val;
        playerOry.setVisible(toggleOry.checked);
    } else if (name === 'music_enabled') {
        toggleMus.checked = val;
        if (toggleMus.checked) audio.play().catch(function(){});
        else audio.pause();
    } else if (name === 'volume') {
        setVolume(val / 100);
    } else if (name === 'gif_speed') {
        gifSpeed = val / 100;
        speedSlider.value = Math.round(gifSpeed * 100);
        speedVal.textContent = gifSpeed.toFixed(1) + 'x';
        playerBase.setSpeed(gifSpeed);
        playerOry.setSpeed(gifSpeed);
    }
}

// Wallpaper Engine
window.wallpaperPropertyListener = {
    applyUserProperties: function(props) {
        if (props.hide_gear_btn !== undefined) applyProperty('hide_gear_btn', props.hide_gear_btn.value);
        if (props.ory_enabled !== undefined) applyProperty('ory_enabled', props.ory_enabled.value);
        if (props.music_enabled !== undefined) applyProperty('music_enabled', props.music_enabled.value);
        if (props.volume !== undefined) applyProperty('volume', props.volume.value);
        if (props.gif_speed !== undefined) applyProperty('gif_speed', props.gif_speed.value);
    }
};

// Lively Wallpaper
window.livelyPropertyListener = function(name, val) {
    applyProperty(name, val);
};

if (typeof window.wallpaperModel !== 'undefined' || typeof window.wallpaperAudioListener !== 'undefined' || typeof window.livelyPropertyListener !== 'undefined') {
    audio.play().catch(function() {});
}

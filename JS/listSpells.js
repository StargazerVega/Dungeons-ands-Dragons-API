// =============================================================
//  listSpells.js  —  Fetch & render all D&D spells + Isotope
// =============================================================
 
var BASE_URL = 'https://www.dnd5eapi.co';
 
var LEVEL_LABELS = {
    0: 'Cantrip',
    1: '1st', 2: '2nd', 3: '3rd',
    4: '4th', 5: '5th', 6: '6th',
    7: '7th', 8: '8th', 9: '9th'
};
 
var SCHOOL_COLORS = {
    abjuration   : '#7ab1e2',
    conjuration  : '#a3d977',
    divination   : '#c2a3e0',
    enchantment  : '#f08080',
    evocation    : '#f4a460',
    illusion     : '#87ceeb',
    necromancy   : '#98fb98',
    transmutation: '#d29a38'
};
 
var $spellsGrid   = null;
var activeFilters = { level: '*', school: '*' };
// Cache populated during initial load — SpellsScript reads from here for instant expand
var spellCache    = {};
 
// ── Init ──────────────────────────────────────────────────────
$(document).ready(function () {
    loadSpells();
    
    $('#themeToggle').on('click', function () {

    var $body = $('body');

    if ($body.hasClass('dark')) {

        $body.removeClass('dark').addClass('light');

        $(this).text('🌙 Dark Mode');

    } else {

        $body.removeClass('light').addClass('dark');

        $(this).text('☀️ Light Mode');
    }
});
});
 
// ── Helpers ───────────────────────────────────────────────────
 
function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
 
// Fetch a URL, retrying automatically on 429 (rate-limited)
async function fetchWithRetry(url, maxRetries, baseDelay) {
    maxRetries = maxRetries !== undefined ? maxRetries : 5;
    baseDelay  = baseDelay  !== undefined ? baseDelay  : 1500;
 
    for (var attempt = 0; attempt <= maxRetries; attempt++) {
        var response = await fetch(url);
 
        if (response.ok) {
            return response.json();
        }
 
        if (response.status === 429) {
            var wait = baseDelay * (attempt + 1);   // 1.5 s, 3 s, 4.5 s…
            console.warn('Rate limited on ' + url + ' — waiting ' + wait + 'ms (attempt ' + (attempt + 1) + ')');
            await sleep(wait);
            continue;
        }
 
        throw new Error('HTTP ' + response.status + ' for ' + url);
    }
 
    throw new Error('Max retries exceeded: ' + url);
}
 
// ── Progress bar helpers ──────────────────────────────────────
 
function setLoadingProgress(text, percent) {
    $('#fireLoaderText').text(text);
    if (percent !== undefined) {
        $('#fireBarFill').css('width', Math.min(percent, 100) + '%');
    }
}
 
// Plays fireball explosion, then resolves after animation + fade-out
function triggerFireballExplosion() {
    return new Promise(function (resolve) {
        var $fill      = $('#fireBarFill');
        var $explosion = $('#fireExplosion');
        var $text      = $('#fireLoaderText');
 
        $text.text('Spells Loaded, 🔥fireball incoming🔥');
        $fill.addClass('bar-complete');               // intense glow burst on bar
 
        // Short pause so the glow registers, then detonate
        setTimeout(function () {
            $explosion.addClass('boom');
 
            // After explosion animation finishes, fade the whole loader out
            setTimeout(function () {
                $('#spells-loading').fadeOut(300, resolve);
            }, 900);
        }, 350);
    });
}
 
// ── Main loader ───────────────────────────────────────────────
async function loadSpells() {
    try {
        setLoadingProgress('Fetching spell list…', 2);
 
        var listData = await fetchWithRetry(BASE_URL + '/api/2014/spells');
        var urls     = listData.results.map(function (s) { return BASE_URL + s.url; });
        var total    = urls.length;
        var allSpells = [];
 
        var BATCH_SIZE  = 10;
        var BATCH_PAUSE = 400;
 
        for (var i = 0; i < urls.length; i += BATCH_SIZE) {
            var batch = urls.slice(i, i + BATCH_SIZE);
 
            var results = await Promise.all(
                batch.map(function (u) { return fetchWithRetry(u); })
            );
 
            allSpells = allSpells.concat(results);
 
            var loaded  = Math.min(i + BATCH_SIZE, total);
            // Map 0–100% fetch progress → 2–96% on bar (leaves room for explosion)
            var barPct  = 2 + Math.round((loaded / total) * 94);
            var pct     = Math.round((loaded / total) * 100);
            setLoadingProgress(
                'Loading spells… ' + loaded + ' / ' + total + ' (' + pct + '%)',
                barPct
            );
 
            if (i + BATCH_SIZE < urls.length) {
                await sleep(BATCH_PAUSE);
            }
        }
 
        // Fill to 100%, pause so the bar visually completes, then detonate
        setLoadingProgress('', 100);
        await sleep(120);
        await triggerFireballExplosion();
 
        renderSpellRows(allSpells);
        allSpells.forEach(function (s) { spellCache[s.index] = s; });
 
    } catch (err) {
        console.error('Error loading spells:', err);
        $('#spells-loading').html(
            '<p style="color:#f08080;margin:1rem">Error: ' + err.message + '</p>' +
            '<button class="btn mt-2" onclick="loadSpells()">Retry</button>'
        );
    }
}
 
// ── Render rows & init Isotope ────────────────────────────────
function renderSpellRows(spells) {
    var $container = $('#spellsCont');
    $container.empty();
 
    spells.forEach(function (spell) {
        var schoolIndex = spell.school ? spell.school.index : 'abjuration';
        var schoolName  = spell.school ? spell.school.name  : 'Unknown';
        var level       = spell.level != null ? spell.level : 0;
        var levelLabel  = LEVEL_LABELS[level] || level + 'th';
        var components  = Array.isArray(spell.components) ? spell.components.join(', ') : '—';
        var imgName     = schoolIndex.charAt(0).toUpperCase() + schoolIndex.slice(1) + 'IMG.png';
        var schoolColor = SCHOOL_COLORS[schoolIndex] || '#c2c2c2';
 
        var rowHTML =
            '<div class="spell-item spell-lvl-' + level + ' school-' + schoolIndex + '"' +
                ' data-index="'  + spell.index              + '"' +
                ' data-level="'  + level                    + '"' +
                ' data-name="'   + spell.name.toLowerCase() + '"' +
                ' data-school="' + schoolIndex              + '">' +
 
                '<div class="spell-row">' +
                    '<div class="col-school">' +
                        '<div class="school-img-wrap" style="border-color:' + schoolColor + '33; background:' + schoolColor + '11">' +
                            '<img src="/ASSETS/IMG/' + imgName + '" alt="' + schoolName + '" title="' + schoolName + '"' +
                                ' onerror="this.style.opacity=\'0\'">' +
                            '<span class="school-initial" style="color:' + schoolColor + '">' + schoolName.charAt(0) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-level">' +
                        '<span class="level-badge lvl-' + level + '">' + levelLabel + '</span>' +
                    '</div>' +
                    '<div class="col-name">' + spell.name + '</div>' +
                    '<div class="col-casting">' + (spell.casting_time || '—') + '</div>' +
                    '<div class="col-components">' +
                        '<span class="components-text">' + components + '</span>' +
                        (spell.material ? '<span class="material-indicator" title="' + spell.material + '">*</span>' : '') +
                    '</div>' +
                    '<div class="col-chevron"><span class="chevron-icon">▾</span></div>' +
                '</div>' +
 
                '<div class="spell-expand-panel">' +
                    '<div class="spell-expand-inner" data-index="' + spell.index + '" data-loaded="false"></div>' +
                '</div>' +
 
            '</div>';
 
        $container.append(rowHTML);
    });
 
    // ── Isotope ───────────────────────────────────────────────
    // fitRows keeps items as positioned elements but respects
    // width:100% correctly, unlike vertical mode.
    $spellsGrid = $container.isotope({
        itemSelector  : '.spell-item',
        layoutMode    : 'fitRows',
        getSortData   : {
            level : '[data-level] parseInt',
            name  : '[data-name]'
        },
        sortBy        : 'level',
        sortAscending : true
    });
 
    wireControls();
}
 
// ── Wire controls ─────────────────────────────────────────────
function wireControls() {
    $('[data-sort]').on('click', function () {
        $spellsGrid.isotope({ sortBy: $(this).data('sort'), sortAscending: true });
        $('[data-sort]').removeClass('active');
        $(this).addClass('active');
    });
 
    $('[data-filter-type]').on('click', function () {
        var type = $(this).data('filter-type');
        activeFilters[type] = $(this).data('filter');
        $spellsGrid.isotope({ filter: combineFilters() });
        $('[data-filter-type="' + type + '"]').removeClass('active');
        $(this).addClass('active');
    });
}
 
function combineFilters() {
    var lf = activeFilters.level;
    var sf = activeFilters.school;
    if (lf === '*' && sf === '*') return '*';
    if (lf === '*') return sf;
    if (sf === '*') return lf;
    return lf + sf;
}
 
// =============================================================
//  listSpells.js  —  Fetch & render all D&D spells + Isotope
// =============================================================

var BASE_URL = 'https://www.dnd5eapi.co';

// Ordinal labels for spell levels
var LEVEL_LABELS = {
    0: 'Cantrip',
    1: '1st', 2: '2nd', 3: '3rd',
    4: '4th', 5: '5th', 6: '6th',
    7: '7th', 8: '8th', 9: '9th'
};

// School colour accents (matches school images naming)
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

// Global Isotope instance + active filters
var $spellsGrid   = null;
var activeFilters = { level: '*', school: '*' };
var currentSort   = { key: 'level', dir: 'asc' };

// ── Init ──────────────────────────────────────────────────────
$(document).ready(function () {
    loadSpells();
});

// ── Fetch list → fetch all details in parallel ────────────────
async function loadSpells() {
    try {
        var listData = await fetch(BASE_URL + '/api/2014/spells').then(function (r) { return r.json(); });

        // Batch fetches in groups of 50 to avoid flooding the browser
        var allSpells = [];
        var urls = listData.results.map(function (s) { return BASE_URL + s.url; });
        var batchSize = 50;

        for (var i = 0; i < urls.length; i += batchSize) {
            var batch = urls.slice(i, i + batchSize);
            var results = await Promise.all(batch.map(function (u) { return fetch(u).then(function (r) { return r.json(); }); }));
            allSpells = allSpells.concat(results);
        }

        renderSpellRows(allSpells);

    } catch (err) {
        console.error('Error loading spells:', err);
        $('#spells-loading').html('<p class="text-danger">Error loading spells. Please refresh.</p>');
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

        // Isotope needs a flat single element per item — the expand panel lives inside it
        var rowHTML =
            '<div class="spell-item spell-lvl-' + level + ' school-' + schoolIndex + '"' +
                ' data-index="'  + spell.index                  + '"' +
                ' data-level="'  + level                        + '"' +
                ' data-name="'   + spell.name.toLowerCase()     + '"' +
                ' data-school="' + schoolIndex                  + '">' +

                // ── Collapsed row ──────────────────────────────
                '<div class="spell-row">' +
                    '<div class="col-school">' +
                        '<div class="school-img-wrap" style="border-color:' + schoolColor + '22; background:' + schoolColor + '11">' +
                            '<img src="/ASSETS/IMG/' + imgName + '" alt="' + schoolName + '"' +
                                ' title="' + schoolName + '"' +
                                ' onerror="this.style.opacity=\'0\'">' +
                            '<span class="school-initial" style="color:' + schoolColor + '">' +
                                schoolName.charAt(0) + '</span>' +
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

                // ── Expanded panel (hidden by default) ────────
                '<div class="spell-expand-panel">' +
                    '<div class="spell-expand-inner" data-index="' + spell.index + '" data-loaded="false">' +
                        '<div class="spell-expand-loading text-center py-3">' +
                            '<div class="spinner-border spinner-border-sm" role="status"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

            '</div>';

        $container.append(rowHTML);
    });

    // ── Isotope init ──────────────────────────────────────────
    $spellsGrid = $container.isotope({
        itemSelector : '.spell-item',
        layoutMode   : 'vertical',
        getSortData  : {
            level : '[data-level] parseInt',
            name  : '[data-name]'
        },
        sortBy    : 'level',
        sortAscending: true
    });

    wireControls();
}

// ── Wire sort & filter buttons ────────────────────────────────
function wireControls() {

    // SORT buttons
    $('[data-sort]').on('click', function () {
        var key = $(this).data('sort');
        var dir = $(this).data('sort-dir') === 'asc';
        currentSort = { key: key, dir: dir };
        $spellsGrid.isotope({ sortBy: key, sortAscending: dir });

        $('[data-sort]').removeClass('active');
        $(this).addClass('active');
    });

    // FILTER buttons (level + school are combined)
    $('[data-filter-type]').on('click', function () {
        var type = $(this).data('filter-type');
        var val  = $(this).data('filter');

        activeFilters[type] = val;

        // Combine both active filters
        var combined = combineFilters();
        $spellsGrid.isotope({ filter: combined });

        // Mark active within the same group only
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
    // Isotope compound filter: element must match BOTH classes
    return lf + sf;    // e.g. ".spell-lvl-3.school-evocation"
}

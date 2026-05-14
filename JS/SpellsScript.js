// =============================================================
//  SpellsScript.js  —  Expand/collapse spell rows + detail view
// =============================================================

// ── Toggle row on click ───────────────────────────────────────
$(document).on('click', '.spell-row', function () {
    var $item  = $(this).closest('.spell-item');
    var $panel = $item.find('.spell-expand-panel');
    var $inner = $item.find('.spell-expand-inner');
    var isOpen = $item.hasClass('spell-open');

    // Close any currently open spell first (instant hide → layout)
    $('.spell-item.spell-open').not($item).each(function () {
        var $o = $(this);
        $o.find('.spell-expand-panel').removeClass('panel-visible').hide();
        $o.removeClass('spell-open');
    });
    // One layout pass after closing others
    if ($spellsGrid) $spellsGrid.isotope('layout');

    if (isOpen) {
        // ── Close ────────────────────────────────────────────
        $panel.removeClass('panel-visible').hide();
        $item.removeClass('spell-open');
        if ($spellsGrid) $spellsGrid.isotope('layout');

    } else {
        // ── Open ─────────────────────────────────────────────
        var spellIndex = $inner.data('index');

        // 1. Inject content first (instant — from cache or renders sync)
        if ($inner.data('loaded') !== true) {
            if (typeof spellCache !== 'undefined' && spellCache[spellIndex]) {
                $inner.html(buildSpellDetail(spellCache[spellIndex]));
                $inner.data('loaded', true);
            }
            // Fallback: async fetch (cache miss — shouldn't happen normally)
            else {
                loadSpellDetail(spellIndex, $inner);
            }
        }

        // 2. Show panel INSTANTLY so Isotope can measure the real height
        $panel.show().addClass('panel-visible');
        $item.addClass('spell-open');

        // 3. Let the browser paint the panel at full height, then re-layout.
        //    requestAnimationFrame ensures the DOM has been reflowed before
        //    Isotope reads the item's new offsetHeight.
        requestAnimationFrame(function () {
            if ($spellsGrid) $spellsGrid.isotope('layout');
        });
    }
});

// ── Async fetch fallback (cache miss) ────────────────────────
async function loadSpellDetail(spellIndex, $inner) {
    var $item  = $inner.closest('.spell-item');
    var $panel = $item.find('.spell-expand-panel');

    $inner.html(
        '<div class="text-center py-3">' +
            '<div class="spinner-border spinner-border-sm" role="status"></div>' +
            '<span class="ms-2 text-muted small">Loading…</span>' +
        '</div>'
    );

    // Show panel at spinner height immediately so Isotope can start moving items
    $panel.show().addClass('panel-visible');
    $item.addClass('spell-open');
    requestAnimationFrame(function () {
        if ($spellsGrid) $spellsGrid.isotope('layout');
    });

    try {
        var spell = await fetchWithRetry(BASE_URL + '/api/2014/spells/' + spellIndex);
        $inner.data('loaded', true);
        $inner.html(buildSpellDetail(spell));
        // Re-layout after content grows from spinner size to full size
        if ($spellsGrid) $spellsGrid.isotope('layout');
    } catch (err) {
        $inner.html(
            '<p class="text-danger p-3">Could not load details. ' +
            '<a href="#" class="retry-spell-link">Retry</a></p>'
        );
        $inner.find('.retry-spell-link').on('click', function (e) {
            e.preventDefault();
            $inner.data('loaded', 'false');
            loadSpellDetail(spellIndex, $inner);
        });
        if ($spellsGrid) $spellsGrid.isotope('layout');
    }
}

// ── Build the expanded detail panel HTML ─────────────────────
function buildSpellDetail(spell) {
    var schoolIndex = spell.school ? spell.school.index : '';
    var schoolName  = spell.school ? spell.school.name  : 'Unknown';
    var schoolColor = (typeof SCHOOL_COLORS !== 'undefined' && SCHOOL_COLORS[schoolIndex]) || '#c2c2c2';
    var level       = spell.level != null ? spell.level : 0;
    var levelLabel  = (typeof LEVEL_LABELS !== 'undefined' && LEVEL_LABELS[level]) || level + 'th';

    // Description
    var descHTML = '';
    if (Array.isArray(spell.desc)) {
        descHTML = spell.desc.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    } else if (spell.desc) {
        descHTML = '<p>' + spell.desc + '</p>';
    }

    // At Higher Levels
    var higherHTML = '';
    if (spell.higher_level && spell.higher_level.length > 0) {
        var higherText = Array.isArray(spell.higher_level)
            ? spell.higher_level.map(function (p) { return '<p>' + p + '</p>'; }).join('')
            : '<p>' + spell.higher_level + '</p>';
        higherHTML =
            '<div class="spell-detail-block">' +
                '<h6 class="detail-block-title">At Higher Levels</h6>' +
                higherText +
            '</div>';
    }

    // Components
    var components   = Array.isArray(spell.components) ? spell.components.join(', ') : '—';
    var materialHTML = spell.material
        ? '<p class="material-note"><em>Materials: ' + spell.material + '</em></p>'
        : '';

    // Classes
    var classesHTML = '';
    if (spell.classes && spell.classes.length > 0) {
        classesHTML = spell.classes.map(function (c) {
            return '<span class="class-tag">' + c.name + '</span>';
        }).join('');
    }

    // Subclasses
    var subclassRow = '';
    if (spell.subclasses && spell.subclasses.length > 0) {
        subclassRow =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Subclasses</span>' +
                '<span class="detail-meta-value">' +
                    spell.subclasses.map(function (s) { return s.name; }).join(', ') +
                '</span>' +
            '</div>';
    }

    // Damage
    var damageHTML = '';
    if (spell.damage) {
        var dmgType = spell.damage.damage_type ? spell.damage.damage_type.name : '';
        var dmgMap  = spell.damage.damage_at_slot_level || spell.damage.damage_at_character_level;
        var dmgKey  = spell.damage.damage_at_slot_level ? 'Slot ' : 'Lv.';
        if (dmgMap) {
            var dmgEntries = Object.entries(dmgMap)
                .map(function (kv) { return dmgKey + kv[0] + ': ' + kv[1]; }).join(' | ');
            damageHTML =
                '<div class="detail-meta-item">' +
                    '<span class="detail-meta-label">Damage' + (dmgType ? ' (' + dmgType + ')' : '') + '</span>' +
                    '<span class="detail-meta-value dmg-value">' + dmgEntries + '</span>' +
                '</div>';
        }
    }

    // Save DC
    var dcHTML = '';
    if (spell.dc) {
        dcHTML =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Save DC</span>' +
                '<span class="detail-meta-value">' +
                    (spell.dc.dc_type ? spell.dc.dc_type.name : '—') +
                    (spell.dc.dc_success ? ' (' + spell.dc.dc_success + ' on success)' : '') +
                '</span>' +
            '</div>';
    }

    // Area of Effect
    var aoeHTML = '';
    if (spell.area_of_effect) {
        aoeHTML =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Area of Effect</span>' +
                '<span class="detail-meta-value">' +
                    spell.area_of_effect.size + ' ft ' + spell.area_of_effect.type +
                '</span>' +
            '</div>';
    }

    // Tags
    var tagsHTML = '';
    if (spell.concentration) tagsHTML += '<span class="spell-tag tag-concentration">Concentration</span> ';
    if (spell.ritual)        tagsHTML += '<span class="spell-tag tag-ritual">Ritual</span> ';
    if (spell.attack_type) {
        var atk = spell.attack_type.charAt(0).toUpperCase() + spell.attack_type.slice(1);
        tagsHTML += '<span class="spell-tag tag-attack">' + atk + ' Attack</span> ';
    }

    return (
        '<div class="spell-detail-body">' +

            // Left: description
            '<div class="spell-detail-left">' +
                '<div class="spell-detail-title-bar">' +
                    '<h4 class="spell-detail-name">' + spell.name + '</h4>' +
                    '<div class="spell-detail-subtitle">' +
                        levelLabel + (level === 0 ? ' Cantrip' : '-level') + ' &nbsp;' +
                        '<span style="color:' + schoolColor + '">' + schoolName + '</span>' +
                        (tagsHTML ? '&nbsp;&nbsp;' + tagsHTML : '') +
                    '</div>' +
                '</div>' +
                '<div class="spell-description">' + descHTML + '</div>' +
                higherHTML +
            '</div>' +

            // Right: stat block
            '<div class="spell-detail-right">' +
                '<div class="detail-meta-grid">' +
                    '<div class="detail-meta-item">' +
                        '<span class="detail-meta-label">Casting Time</span>' +
                        '<span class="detail-meta-value">' + (spell.casting_time || '—') + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<span class="detail-meta-label">Range</span>' +
                        '<span class="detail-meta-value">' + (spell.range || '—') + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<span class="detail-meta-label">Duration</span>' +
                        '<span class="detail-meta-value">' + (spell.duration || '—') + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<span class="detail-meta-label">Components</span>' +
                        '<span class="detail-meta-value">' + components + '</span>' +
                    '</div>' +
                    damageHTML + dcHTML + aoeHTML + subclassRow +
                '</div>' +
                materialHTML +
                (classesHTML
                    ? '<div class="detail-classes"><span class="detail-meta-label">Available to</span>' +
                      '<div class="class-tags-wrap">' + classesHTML + '</div></div>'
                    : '') +
            '</div>' +

        '</div>'
    );
}
// ── NAVBAR HAMBURGER
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
});

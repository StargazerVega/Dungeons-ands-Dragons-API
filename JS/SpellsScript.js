// =============================================================
//  SpellsScript.js  —  Expand/collapse spell rows with full detail
// =============================================================

$(document).on('click', '.spell-row', function () {
    var $item  = $(this).closest('.spell-item');
    var $panel = $item.find('.spell-expand-panel');
    var $inner = $item.find('.spell-expand-inner');
    var isOpen = $item.hasClass('spell-open');

    // Close any other open spell first
    $('.spell-item.spell-open').not($item).each(function () {
        var $other = $(this);
        $other.find('.spell-expand-panel').css('max-height', '0');
        $other.removeClass('spell-open');
    });

    if (isOpen) {
        // Collapse
        $panel.css('max-height', '0');
        $item.removeClass('spell-open');
    } else {
        // Expand — lazy-load detail on first open
        $item.addClass('spell-open');

        if ($inner.data('loaded') === false || $inner.data('loaded') === 'false') {
            loadSpellDetail($inner.data('index'), $inner);
        }

        // Set max-height after a tick so CSS transition fires
        setTimeout(function () {
            $panel.css('max-height', $panel[0].scrollHeight + 200 + 'px');
        }, 10);
    }
});

// ── Fetch full spell detail and render it ─────────────────────
async function loadSpellDetail(spellIndex, $inner) {
    try {
        var spell = await fetch(BASE_URL + '/api/2014/spells/' + spellIndex).then(function (r) { return r.json(); });

        $inner.data('loaded', true);
        $inner.html(buildSpellDetail(spell));

        // Re-adjust max-height now that real content is rendered
        var $panel = $inner.closest('.spell-expand-panel');
        $panel.css('max-height', $panel[0].scrollHeight + 200 + 'px');

    } catch (err) {
        $inner.html('<p class="text-danger p-3">Could not load spell details.</p>');
    }
}

// ── Build the expanded detail HTML ────────────────────────────
function buildSpellDetail(spell) {

    var schoolIndex = spell.school ? spell.school.index : '';
    var schoolName  = spell.school ? spell.school.name  : 'Unknown';
    var schoolColor = (typeof SCHOOL_COLORS !== 'undefined' && SCHOOL_COLORS[schoolIndex]) || '#c2c2c2';
    var level       = spell.level != null ? spell.level : 0;
    var levelLabel  = (typeof LEVEL_LABELS !== 'undefined' && LEVEL_LABELS[level]) || level + 'th';

    // ── Description paragraphs ───────────────────────────────
    var descHTML = '';
    if (Array.isArray(spell.desc)) {
        descHTML = spell.desc.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    } else if (spell.desc) {
        descHTML = '<p>' + spell.desc + '</p>';
    }

    // ── At higher levels ────────────────────────────────────
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

    // ── Components ───────────────────────────────────────────
    var components = Array.isArray(spell.components) ? spell.components.join(', ') : '—';
    var materialHTML = spell.material
        ? '<p class="material-note"><em>Materials: ' + spell.material + '</em></p>'
        : '';

    // ── Classes ──────────────────────────────────────────────
    var classesHTML = '';
    if (spell.classes && spell.classes.length > 0) {
        classesHTML = spell.classes.map(function (c) {
            return '<span class="class-tag">' + c.name + '</span>';
        }).join('');
    }

    // ── Subclasses ───────────────────────────────────────────
    var subclassHTML = '';
    if (spell.subclasses && spell.subclasses.length > 0) {
        subclassHTML =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Subclasses</span>' +
                '<span class="detail-meta-value">' +
                    spell.subclasses.map(function (s) { return s.name; }).join(', ') +
                '</span>' +
            '</div>';
    }

    // ── Damage / DC block ────────────────────────────────────
    var damageHTML = '';
    if (spell.damage) {
        var dmgType = spell.damage.damage_type ? spell.damage.damage_type.name : '';
        if (spell.damage.damage_at_slot_level) {
            var dmgSlots = Object.entries(spell.damage.damage_at_slot_level)
                .map(function (kv) { return 'Slot ' + kv[0] + ': ' + kv[1]; }).join(' &nbsp;|&nbsp; ');
            damageHTML =
                '<div class="detail-meta-item">' +
                    '<span class="detail-meta-label">Damage (' + dmgType + ')</span>' +
                    '<span class="detail-meta-value">' + dmgSlots + '</span>' +
                '</div>';
        } else if (spell.damage.damage_at_character_level) {
            var dmgLevels = Object.entries(spell.damage.damage_at_character_level)
                .map(function (kv) { return 'Lv.' + kv[0] + ': ' + kv[1]; }).join(' &nbsp;|&nbsp; ');
            damageHTML =
                '<div class="detail-meta-item">' +
                    '<span class="detail-meta-label">Damage (' + dmgType + ')</span>' +
                    '<span class="detail-meta-value">' + dmgLevels + '</span>' +
                '</div>';
        }
    }

    var dcHTML = '';
    if (spell.dc) {
        var dcType    = spell.dc.dc_type   ? spell.dc.dc_type.name      : '—';
        var dcSuccess = spell.dc.dc_success ? spell.dc.dc_success        : '—';
        dcHTML =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Save DC</span>' +
                '<span class="detail-meta-value">' + dcType + ' (' + dcSuccess + ' on success)</span>' +
            '</div>';
    }

    // ── Area of effect ───────────────────────────────────────
    var aoeHTML = '';
    if (spell.area_of_effect) {
        aoeHTML =
            '<div class="detail-meta-item">' +
                '<span class="detail-meta-label">Area</span>' +
                '<span class="detail-meta-value">' +
                    spell.area_of_effect.size + ' ft ' + spell.area_of_effect.type +
                '</span>' +
            '</div>';
    }

    // ── Tags / flags ─────────────────────────────────────────
    var tagsHTML = '';
    if (spell.concentration) tagsHTML += '<span class="spell-tag tag-concentration">Concentration</span>';
    if (spell.ritual)        tagsHTML += '<span class="spell-tag tag-ritual">Ritual</span>';
    if (spell.attack_type)   tagsHTML += '<span class="spell-tag tag-attack">' + spell.attack_type.charAt(0).toUpperCase() + spell.attack_type.slice(1) + ' Attack</span>';

    // ── Final HTML assembly ──────────────────────────────────
    return (
        '<div class="spell-detail-body">' +

            // Left column: description
            '<div class="spell-detail-left">' +

                '<div class="spell-detail-title-bar">' +
                    '<h4 class="spell-detail-name">' + spell.name + '</h4>' +
                    '<div class="spell-detail-subtitle">' +
                        levelLabel + (level === 0 ? '' : '-level') + ' ' +
                        '<span style="color:' + schoolColor + '">' + schoolName + '</span>' +
                        (tagsHTML ? ' &nbsp;' + tagsHTML : '') +
                    '</div>' +
                '</div>' +

                '<div class="spell-description">' + descHTML + '</div>' +
                higherHTML +

            '</div>' +

            // Right column: metadata
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
                    damageHTML +
                    dcHTML +
                    aoeHTML +
                    subclassHTML +
                '</div>' +

                materialHTML +

                (classesHTML
                    ? '<div class="detail-classes"><span class="detail-meta-label">Available to</span><div class="class-tags-wrap">' + classesHTML + '</div></div>'
                    : '') +

            '</div>' +

        '</div>'
    );
}

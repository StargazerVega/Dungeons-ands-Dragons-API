//VARIABLES

//variables para columnas de elementos especificos por clase
var CLASS_SPECIFIC_LABELS = {
    rage_count: 'Rages',
    rage_damage_bonus: 'Rage Dmg',
    brutal_critical_dice: 'Brutal Critical',
    bardic_inspiration_die: 'Bardic Insp.',
    song_of_rest_die: 'Song of Rest',
    magical_secrets_max_5: 'Mag. Sec. 5th',
    magical_secrets_max_7: 'Mag. Sec. 7th',
    magical_secrets_max_9: 'Mag. Sec. 9th',
    channel_divinity_charges: 'Channel Divinity',
    destroy_undead_cr: 'Destroy Undead CR',
    wild_shape_max_cr: 'Wild Shape CR',
    wild_shape_swim: 'Swim',
    wild_shape_fly: 'Fly',
    action_surges: 'Action Surges',
    indomitable_uses: 'Indomitable',
    extra_attacks: 'Extra Attacks',
    martial_arts_die: 'Martial Arts',
    ki_points: 'Ki Points',
    unarmored_movement: 'Unarmored Mov.',
    aura_range: 'Aura Range',
    favored_enemies: 'Favored Enemies',
    favored_terrain: 'Favored Terrain',
    sneak_attack_die: 'Sneak Attack',
    sorcery_points: 'Sorcery Points',
    metamagic_known: 'Metamagic',
    invocations_known: 'Invocations',
    mystic_arcanum_level_6: 'Arcanum 6th',
    mystic_arcanum_level_7: 'Arcanum 7th',
    mystic_arcanum_level_8: 'Arcanum 8th',
    mystic_arcanum_level_9: 'Arcanum 9th',
    arcane_recovery_levels: 'Arcane Recovery',
    creating_spell_slots_max_spell_level: 'Max Slot Level'
};

//Variables para las columnas de hechizod
var SPELL_SLOT_LABELS = {
    cantrips_known: 'Cantrips',
    spells_known: 'Spells Known',
    spell_slots_level_1: '1st',
    spell_slots_level_2: '2nd',
    spell_slots_level_3: '3rd',
    spell_slots_level_4: '4th',
    spell_slots_level_5: '5th',
    spell_slots_level_6: '6th',
    spell_slots_level_7: '7th',
    spell_slots_level_8: '8th',
    spell_slots_level_9: '9th'
};

var levelNum = ['Lvl.1','Lvl.2','Lvl.3','Lvl.4','Lvl.5','Lvl.6','Lvl.7','Lvl.8','Lvl.9','Lvl.10',
             'Lvl.11','Lvl.12','Lvl.13','Lvl.14','Lvl.15','Lvl.16','Lvl.17','Lvl.18','Lvl.19','Lvl.20'];

$(document).ready(function () {
             
//Botón de seleccióin de clase
$(document).on('click', '.selectClassBtn', function (e) {
    e.preventDefault();
    var classIndex = $(this).data('index');
    var className  = $(this).data('name');
    loadClassDetails(classIndex, className);
});

//FETCH de datos de clase y sus descripciones
async function loadClassDetails(classIndex, className) {
    var $section = $('.levelUpCont');

    //Spinner de carga
    $section.html(
        '<div class="text-center py-5">' +
            '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>' +
            '<p class="mt-3 text-muted small">Loading ' + className + '…</p>' +
        '</div>'
    );
    $('html, body').animate({ scrollTop: $section.offset().top - 80 }, 600);

    try {
        //Fetchs en paralelo con map y promise
        var results = await Promise.all([
            fetch(BASE_URL + '/api/2014/classes/' + classIndex).then(function (r) { return r.json(); }),
            fetch(BASE_URL + '/api/2014/classes/' + classIndex + '/levels').then(function (r) { return r.json(); })
        ]);
        var classData  = results[0];
        var levelsData = results[1];

        //URLs especificas de cada feature
        var featuresMap = {};
        levelsData.forEach(function (lvl) {
            lvl.features.forEach(function (f) {
                featuresMap[f.index] = f;
            });
        });

        //Fetch de las features en paralelo
        var featureDetails = await Promise.all(
            Object.values(featuresMap).map(function (f) {
                return fetch(BASE_URL + f.url).then(function (r) { return r.json(); });
            })
        );

        var featuresById = {};
        featureDetails.forEach(function (f) { featuresById[f.index] = f; });

        renderClassDetails(classData, levelsData, featuresById);

    } catch (err) {
        console.error('Error loading class details:', err);
        $section.html('<p class="text-danger p-4">Could not load ' + className + '. Please try again.</p>');
    }
}

//Creación del HTML a insertar
function renderClassDetails(classData, levelsData, featuresById) {

    //Contamos cuantas columnas especificas de clase tiene esta clase
    var classSpecificKeys = [];
    if (levelsData[0] && levelsData[0].class_specific) {
        classSpecificKeys = Object.keys(levelsData[0].class_specific);
    }

    //Contamos cuantas columnas de niveles de hechizo tiene esta clase
    var spellcastingKeys = [];
    var casterLevel = null;
    for (var i = 0; i < levelsData.length; i++) {
        if (levelsData[i].spellcasting && Object.keys(levelsData[i].spellcasting).length > 0) {
            casterLevel = levelsData[i];
            break;
        }
    }
    if (casterLevel) {
        spellcastingKeys = Object.keys(casterLevel.spellcasting);
    }

    //Header de la tabla de progresión
    var headerHTML = '<th>Level</th><th>Prof. Bonus</th><th class="features-col">Features</th>';

    classSpecificKeys.forEach(function (key) {
        var label = CLASS_SPECIFIC_LABELS[key] || key.replace(/_/g, ' ');
        headerHTML += '<th>' + label + '</th>';
    });
    spellcastingKeys.forEach(function (key) {
        var label = SPELL_SLOT_LABELS[key] || key.replace(/_/g, ' ');
        headerHTML += '<th>' + label + '</th>';
    });

    //Filñas de la tabla de progresión
    var rowsHTML = '';
    levelsData.forEach(function (lvl) {

        var featureCells = lvl.features.length > 0
            ? lvl.features.map(function (f) {
                  return '<span class="feat-link" data-feature="' + f.index + '">' + f.name + '</span>';
              }).join(', ')
            : '<span class="empty-cell">—</span>';

        var row =
            '<tr>' +
            '<td class="level-cell"><span class="levelNum-level">' + levelNum[lvl.level - 1] + '</span></td>' +
            '<td class="prof-cell">+' + lvl.prof_bonus + '</td>' +
            '<td class="features-col">' + featureCells + '</td>';

        classSpecificKeys.forEach(function (key) {
            var val = lvl.class_specific ? lvl.class_specific[key] : null;
            row += '<td>' + formatSpecificVal(key, val) + '</td>';
        });

        spellcastingKeys.forEach(function (key) {
            var val = (lvl.spellcasting != null) ? lvl.spellcasting[key] : null;
            if (val == null || val === 0) {
                row += '<td><span class="empty-cell">—</span></td>';
            } else {
                row += '<td>' + val + '</td>';
            }
        });

        row += '</tr>';
        rowsHTML += row;
    });

    //Acordeón con las Features de la clase
    var accordionHTML = '';
    var seen = {};
    levelsData.forEach(function (lvl) {
        lvl.features.forEach(function (f) {
            if (!seen[f.index] && featuresById[f.index]) {
                seen[f.index] = true;
                var fd = featuresById[f.index];

                // desc is an array of paragraphs in the API
                var descHTML = '';
                if (Array.isArray(fd.desc)) {
                    descHTML = fd.desc.map(function (d) { return '<p>' + d + '</p>'; }).join('');
                } else {
                    descHTML = '<p>' + (fd.desc || 'No description available.') + '</p>';
                }

                // Prerequisites (e.g. multiclassing features)
                var prereqHTML = '';
                if (fd.prerequisites && fd.prerequisites.length > 0) {
                    prereqHTML = '<p class="prereq-note"><strong>Prerequisites:</strong> ' +
                        fd.prerequisites.map(function (p) { return p.name; }).join(', ') + '</p>';
                }

                accordionHTML +=
                    '<div class="accordion-item feature-accordion-item" id="feat-wrap-' + f.index + '">' +
                        '<h2 class="accordion-header">' +
                            '<button class="accordion-button collapsed" type="button"' +
                                ' data-bs-toggle="collapse"' +
                                ' data-bs-target="#feat-' + f.index + '"' +
                                ' aria-expanded="false"' +
                                ' aria-controls="feat-' + f.index + '">' +
                                '<span class="feat-level-badge">Lv.' + lvl.level + '</span>' +
                                fd.name +
                            '</button>' +
                        '</h2>' +
                        '<div id="feat-' + f.index + '" class="accordion-collapse collapse">' +
                            '<div class="accordion-body">' + descHTML + prereqHTML + '</div>' +
                        '</div>' +
                    '</div>';
            }
        });
    });

    //Category Badge
    var category    = (typeof CLASS_CATEGORIES !== 'undefined' && CLASS_CATEGORIES[classData.index]) || '';
    var badgeClass  = category ? 'category-badge ' + category : '';
    var categoryBadge = category
        ? '<span class="' + badgeClass + '">' + category.replace('-', ' ') + '</span>'
        : '';

    //Competencia con armas y armaduras
    var armorProfs = '';
    var weaponProfs = '';
    if (classData.proficiencies) {
        var armors  = classData.proficiencies.filter(function (p) { return p.index.includes('armor'); });
        var weapons = classData.proficiencies.filter(function (p) { return !p.index.includes('armor'); });
        armorProfs  = armors.length  ? armors.map(function (p) { return p.name; }).join(', ')  : '—';
        weaponProfs = weapons.length ? weapons.map(function (p) { return p.name; }).join(', ') : '—';
    }

    //HTML a insertar
    var sectionHTML =
        '<div class="class-detail-container px-3 px-md-5 py-5">' +

            //Header
            '<div class="class-detail-header mb-4">' +
                '<h2 class="class-detail-title">' + classData.name + ' ' + categoryBadge + '</h2>' +
                '<div class="class-meta-bar">' +
                    '<div class="class-meta-item">' +
                        '<span class="meta-label">Hit Die</span>' +
                        '<span class="meta-value">d' + classData.hit_die + '</span>' +
                    '</div>' +
                    '<div class="class-meta-item">' +
                        '<span class="meta-label">Saving Throws</span>' +
                        '<span class="meta-value">' + classData.saving_throws.map(function (s) { return s.name; }).join(', ') + '</span>' +
                    '</div>' +
                    '<div class="class-meta-item">' +
                        '<span class="meta-label">Armor</span>' +
                        '<span class="meta-value">' + armorProfs + '</span>' +
                    '</div>' +
                    '<div class="class-meta-item">' +
                        '<span class="meta-label">Weapons</span>' +
                        '<span class="meta-value">' + weaponProfs + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            //Tabla de progresión
            '<h4 class="section-subtitle">Class Progression</h4>' +
            '<div class="table-responsive mb-5">' +
                '<table class="table class-table">' +
                    '<thead><tr>' + headerHTML + '</tr></thead>' +
                    '<tbody>' + rowsHTML + '</tbody>' +
                '</table>' +
            '</div>' +

            //Acordeón de Features
            '<h4 class="section-subtitle">Class Features</h4>' +
            '<div class="accordion features-accordion" id="featuresAccordion">' +
                accordionHTML +
            '</div>' +

        '</div>';

    $('.levelUpCont').html(sectionHTML);

    //Link de las Features de la tabla al acordeón
    $(document).on('click', '.feat-link', function () {
        var featIndex = $(this).data('feature');
        var $collapse = $('#feat-' + featIndex);
        if ($collapse.length) {
            //Bootstrap 5 collapse API
            var bsCollapse = bootstrap.Collapse.getOrCreateInstance($collapse[0], { toggle: false });
            bsCollapse.show();
            setTimeout(function () {
                var $wrap = $('#feat-wrap-' + featIndex);
                if ($wrap.length) {
                    $('html, body').animate({ scrollTop: $wrap.offset().top - 80 }, 400);
                }
            }, 200);
        }
    });
}

//Función para excepciones en las columnas de la tabla
function formatSpecificVal(key, val) {
    if (val === null || val === undefined) return '<span class="empty-cell">—</span>';
    if (typeof val === 'boolean')          return val ? '✓' : '<span class="empty-cell">—</span>';
    if (typeof val === 'number') {
        if (val === 0) return '<span class="empty-cell">—</span>';
        if (key.endsWith('_die')) return 'd' + val;
        if (key === 'unarmored_movement') return '+' + val + ' ft';
        if (key === 'aura_range') return val + ' ft';
        return val;
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
        if (val.dice_count && val.dice_value) {
            return val.dice_count + 'd' + val.dice_value;
        }
        return Object.values(val).join(' / ');
    }
    if (Array.isArray(val)) {
        return val.map(function (v) {
            if (v.spell_slot_level && v.sorcery_point_cost) {
                return 'Lv' + v.spell_slot_level + ': ' + v.sorcery_point_cost + ' SP';
            }
            return JSON.stringify(v);
        }).join('<br>');
    }

    return val; 
}

});
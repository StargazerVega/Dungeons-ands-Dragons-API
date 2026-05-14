//VARIABLES

//Definición de clasificación Martial/Caster
var CLASS_CATEGORIES = {
    barbarian: 'martial',
    fighter: 'martial',
    monk: 'martial',
    rogue: 'martial',
    bard: 'caster',
    cleric: 'caster',
    druid: 'caster',
    sorcerer: 'caster',
    warlock: 'caster',
    wizard: 'caster',
    paladin: 'half-caster',
    ranger: 'half-caster'
};
//Base de la URL para evitar tener que escribirla cada vez
var BASE_URL = 'https://www.dnd5eapi.co';



//INICIALIZACIÓN
$(document).ready(function () {
    loadClasses();
});

//FETCH
async function loadClasses() {
    try {
        //Primero la lista de indices
        var listData = await fetch(BASE_URL + '/api/2014/classes').then(function (r) { return r.json(); });

        //Luego tomamos los detalles para cada una
        var classes = await Promise.all(
            listData.results.map(function (c) {
                return fetch(BASE_URL + '/api/2014/classes/' + c.index).then(function (r) { return r.json(); });
            })
        );

        renderClassCards(classes);

    } catch (err) {
        console.error('Error loading classes:', err);
        $('#classesCont').html('<p class="text-danger p-4">Error loading classes. Please refresh the page.</p>');
    }
}

//Creamos el HTML para insertar y asignamos las clasificaciones de Martial/Caster
function renderClassCards(classes) {
    var $container = $('#classesCont');
    $container.empty();

    classes.forEach(function (cls) {
        var category  = CLASS_CATEGORIES[cls.index] || 'martial';
        var saves     = cls.saving_throws.map(function (s) { return s.name; }).join(' & ');
        var imgName   = cls.index.charAt(0).toUpperCase() + cls.index.slice(1) + 'IMG.png';

        var cardHTML =
            '<div class="classes col-6 col-sm-4 col-md-3 col-xl-2 ' + category + '">' +
                '<div class="card class-card">' +
                    '<img src="./ASSETS/IMG/' + imgName + '" class="card-img" alt="' + cls.name + '"' +
                        ' onerror="this.style.filter=\'grayscale(1) opacity(0.25)\'">' +
                    '<div class="card-img-overlay d-flex flex-column justify-content-end">' +
                        '<h5 class="card-title mb-1">' + cls.name + '</h5>' +
                        '<p class="card-text small mb-0">Hit Die: <strong>d' + cls.hit_die + '</strong></p>' +
                        '<p class="card-text small mb-2">Saves: <strong>' + saves + '</strong></p>' +
                        '<button class="btn selectClassBtn"' +
                            ' data-index="' + cls.index + '"' +
                            ' data-name="'  + cls.name  + '">Select Class</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        $container.append(cardHTML);
    });

    //Inicializamos Isotope
    var $grid = $('#classesCont');

    $grid.isotope({
        itemSelector : '.classes',
        layoutMode   : 'fitRows'
    });

    //Seteamos los botones de filtrado de Isotope
    $('.filter').on('click', function () {
        var filterVal = $(this).data('filter');
        $grid.isotope({ filter: filterVal });
        $('.filter').removeClass('active');
        $(this).addClass('active');
    });
}

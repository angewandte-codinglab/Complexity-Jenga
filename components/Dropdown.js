const createDropdown = (container, id, list, list_default, onchangeFunc) => {
    const options = container.selectAll('.dropdown').data([0])
        .join('div').attr('class', 'option-container dropdown')
        .attr('id', id)
    const dropbtn = options.selectAll('.dropbtn').data([0])
        .join('button').attr('class', 'dropbtn btn btn-sm btn-light fw-bold')
        .on('click', function() {
            // d3.selectAll('.dropdown').classed('show', false)
            // showDropdown(id)
            d3.selectAll(`.dropdown:not(#${id})`).classed('show', false)

            showDropdown(id)
        })
    const optionContainer = options.selectAll('.dropdown-content').data([0])
        .join('div')
        .attr('id', id).attr('class', "dropdown-content p-2")


    dropbtn.html(list_default.name)
    optionContainer.selectAll('.option').data(list)
        .join('div').attr('class', d => `option dropdown-option-${d.id} btn btn-sm btn-light mb-2`)
        .html(d => `
            <div class="d-flex flex-column">
                <div>${d.name}</div>
            </div>`)
        .on('click', function(d) {
            onchange(d)

        })


    function onchange(d) {
        dropbtn.html(d.name)
        onchangeFunc(d)
        
    }

    (function() {
        function triggerDropdown(event) {
            
            const d = event.detail;
            dropbtn.html(d.name)
            onchangeFunc(d)

        }
        // optionItem.on('triggerDropdownEvent', triggerDropdown);
        container.node().querySelectorAll('.option').forEach(function(item) {
            item.addEventListener('triggerDropdownEvent', triggerDropdown);
        });

    })();


}



function showDropdown(id, show) {

    if (show !== undefined) {
        d3.select(`#${id}`).classed("show", show)
    } else {
        document.getElementById(id).classList.toggle("show");
    }

}
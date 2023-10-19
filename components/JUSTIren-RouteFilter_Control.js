// *******************************************************************************************
//********************************************************************************************
//**** Plugin for GEOweb - JUSTIren - Filter layers belonging to a single route
//********************************************************************************************

window.GCComponents["Layers"].addLayer('layer-justiren-routefilter-highlight', {
    displayInLayerSwitcher:false,
    styleMap: new OpenLayers.StyleMap({
        'default': {
            fill: false,
            fillColor: "red",
            fillOpacity: 0.7,
            hoverFillColor: '${color}',
            hoverFillOpacity: 0.9,
            fillColor: '${color}',
            strokeColor: '${color}',
            strokeOpacity: 0.7,
            strokeWidth: '${width}',
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: '${color}',
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: '${width}',
            pointRadius: '${width}',
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "inherit"
        },
        'select': {
            fill: true,
            fillColor: '${color}',
            fillOpacity: 0.9,
            hoverFillColor: '${color}',
            hoverFillOpacity: 0.9,
            strokeColor: '${color}',
            strokeOpacity: 1,
            strokeWidth: '${width}',
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: '${color}',
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: '${width}',
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        },
        'temporary': {
            fill: true,
            fillColor: "EEA652",
            fillOpacity: 0.2,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "#EEA652",
            strokeOpacity: 1,
            strokeLinecap: "round",
            strokeWidth: 4,
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        }
    })
}, {
    "refresh": function() {
        this.redraw();
        var layerExtent = null;
        if (this.features.length > 0) {
            var layerExtent = this.getDataExtent();
            if (!layerExtent.intersectsBounds(this.map.getMaxExtent())) {
                layerExtent = null;
            }
        }
        if (layerExtent) {
            this.map.zoomToExtent(layerExtent);
        }
    },
    "beforefeatureadded": function(obj) {

    },
    "featureadded": function(obj) {

    }
});

window.GCComponents["Controls"].addControl('control-justiren-routefilter-toolbar', function(map){
    return new  OpenLayers.Control.Panel({
        gc_id: 'control-justiren-routefilter-toolbar',
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-justiren-routefilter"),
        autoActivate:false,
        saveState:true,
        draw: function() {
            var controls = [
                new OpenLayers.Control(
                    {
                        ctrl: this,
                        type: OpenLayers.Control.TYPE_BUTTON ,
                        iconclass:"glyphicon-white glyphicon-random",
                        text:"Servizio Spazzamento",
                        title:"Spazzamento",
                        trigger: function () {
                            window.GCComponents.Functions.JUSTIrenRouteFilterSearchPanel.call(this, clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_LAYERS, clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_LAYERS_SEARCH, clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_FIELDS_SEARCH, window.GCComponents.Functions.JUSTIrenRouteFilterExecute, 'Ricerca Itinerari Spazzamento', clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_FREQUENCY_RELATION, clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_FREQUENCY_RELATION_FIELD, clientConfig.JUSTIREN_ROUTEFILTER_SPAZZAMENTO_FREQUENCY_RELATION_FIELD_LABEL);
                        }
                    }
                ),
                new OpenLayers.Control(
                    {
                        ctrl: this,
                        type: OpenLayers.Control.TYPE_BUTTON ,
                        iconclass:"glyphicon-white glyphicon-trash",
                        text:"Servizio Raccolta",
                        title:"Raccolta",
                        trigger: function () {
                            window.GCComponents.Functions.JUSTIrenRouteFilterSearchPanel.call(this, clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_LAYERS, clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_LAYERS_SEARCH, clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_FIELDS_SEARCH, window.GCComponents.Functions.JUSTIrenRouteFilterExecute, 'Ricerca Itinerari Racccolta', clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_FREQUENCY_RELATION, clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_FREQUENCY_RELATION_FIELD, clientConfig.JUSTIREN_ROUTEFILTER_RACCOLTA_FREQUENCY_RELATION_FIELD_LABEL);                        }
                    }
                )
            ];
            this.addControls(controls);
            OpenLayers.Control.Panel.prototype.draw.apply(this)
        },
        redraw: function () {
            OpenLayers.Control.Panel.prototype.redraw.apply(this);
            var sectPanel = document.createElement("div");
            sectPanel.setAttribute('id', 'justiren-routefilter_panel');
            this.div.appendChild(sectPanel);
            var sectPanelHeader = document.createElement("div");
            sectPanelHeader.setAttribute('id', 'justiren-routefilter_panel_header');
            sectPanelHeader.innerHTML = '<a href="#" id="justiren-routefilter_panel_toggle"><span id="justiren-routefilter_panel_toggle_span" class="icon-hide-panel"></span></a><span id="justiren-routefilter_panel_title">Circuito Selezionato</span>'
            sectPanel.appendChild(sectPanelHeader);
            var sectPanelParentContent = document.createElement("div");
            sectPanelParentContent.setAttribute('id', 'justiren-routefilter_panel_parent_content');
            sectPanel.appendChild(sectPanelParentContent);
            var sectPanelContent = document.createElement("div");
            sectPanelContent.setAttribute('id', 'justiren-routefilter_panel_content');
            sectPanel.appendChild(sectPanelContent);
            $("#justiren-routefilter_panel_header a").click(function() {
                event.stopPropagation();
                if ($("#justiren-routefilter_panel_toggle_span").hasClass('icon-hide-panel')) {
                    $("#justiren-routefilter_panel_toggle_span").removeClass('icon-hide-panel');
                    $("#justiren-routefilter_panel_toggle_span").addClass('icon-show-panel');
                    $('#justiren-routefilter_panel').css('height', 'auto');
                    $('#justiren-routefilter_panel_parent_content').css('display', 'none');
                    $('#justiren-routefilter_panel_content').css('display', 'none');
                }
                else {
                    $("#justiren-routefilter_panel_toggle_span").removeClass('icon-show-panel');
                    $("#justiren-routefilter_panel_toggle_span").addClass('icon-hide-panel');
                    var panelSize = $('#justiren-routefilter_panel').height();
                    var maxPanelSize = $('#map').height() - 50;
                    if (panelSize > maxPanelSize) {
                        $('#justiren-routefilter_panel').css('height', maxPanelSize);
                        $('#justiren-routefilter_panel').css('overflow', 'auto');
                    }
                    $('#justiren-routefilter_panel_parent_content').css('display', 'block');
                    $('#justiren-routefilter_panel_content').css('display', 'block');
                }
            });
        }
    })
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-justiren-routefilter-toolbar',
    'Toolbar Filtro su Itinerario',
    'icon-justiren-routefilter',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            if (this.active) {
                this.deactivate();
                var JUSTIrenRouteFilterToolbarControl = this.map.getControlsBy('gc_id', 'control-justiren-routefilter-toolbar');
                if (JUSTIrenRouteFilterToolbarControl.length == 1) {
                    JUSTIrenRouteFilterToolbarControl[0].deactivate();
                    this.map.currentControl = this.map.defaultControl;
                }
                window.GCComponents.Functions.JUSTIrenRouteFilterClear();
            }
            else
            {
                this.activate();
                var JUSTIrenRouteFilterToolbarControl = this.map.getControlsBy('gc_id', 'control-justiren-routefilter-toolbar');
                if (JUSTIrenRouteFilterToolbarControl.length == 1) {
                    JUSTIrenRouteFilterToolbarControl[0].activate();
                    if (JUSTIrenRouteFilterToolbarControl[0].controls.length > 2) {
                        JUSTIrenRouteFilterToolbarControl[0].controls[4].deactivate();
                    }
                }
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);

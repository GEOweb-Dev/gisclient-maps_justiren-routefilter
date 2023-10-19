// *******************************************************************************************
//********************************************************************************************
//**** Plugin for GEOweb - JUSTIren - Filter layers belonging to a single route
//********************************************************************************************

window.GCComponents.Functions.JUSTIrenRouteFilterSearchPanel = function (objLayers, arrSearchLayers, arrFields, searchFunction, formTitle, relationName1n, fieldName1n, fieldLabel1n) {
    if (typeof(searchFunction) != 'function' || typeof(objLayers) != 'object' || typeof(arrSearchLayers) != 'object' || typeof(arrFields) != 'object') {
        alert ('Parametri non corretti, impossibile aprire il pannello di ricerca');
        return;
    }

    var parentData = {};
    var formData = {};

    if (arrSearchLayers.length == 0) {
        arrSearchLayers = objLayers;
    }
    formTitle = typeof formTitle !== 'undefined' ? formTitle : 'Pannello di ricerca JUSTIren - Filtro su Itinerari';

    $('li[role="advanced-search"]').hide();
    $('#ricerca').addClass('active');
    $('#avanzata').removeClass('active');
    $('#searchFormTitle').html(formTitle);

    var eeProps = {};

    for (var k = 0; k < arrSearchLayers.length; k++) {
        var fTypeK = GisClientMap.getFeatureType(arrSearchLayers[k]);
        if(!fTypeK) continue;
        var propertiesK = fTypeK.properties;
        var eePropData = [];
        for (var idx = 0; idx < propertiesK.length; idx++) {
            var nameK = propertiesK[idx].name;
            if (arrFields.some(function(arrVal) {
                    eePropData = arrVal.split(':');
                    return nameK === eePropData[0];
                })) {
                if (eeProps[nameK] === undefined) {
                    eeProps[nameK] = propertiesK[idx];
                    if (eePropData.length == 1) {
                        eeProps[nameK].searchType = 3;
                    }
                    else {
                        eeProps[nameK].searchType = parseInt(eePropData[1]);
                    }
                }
                else {
                    eeProps[nameK].fieldId += ',' + propertiesK[idx].fieldId;
                }
            }
        }
    }

    var hasProperties = false;
    var form = '<table id="justiren-routefilter_search_table">';
    $.each(eeProps, function(key, property) {
        if(!property.searchType) return; //searchType undefined oppure 0

        hasProperties = true;
        //form += '<div class="form-group">'+
        //            '<label for="search_form_input_'+key+'">'+property.header+'</label>';
        form += '<tr><td>'+property.header+'</td><td>';

        switch(property.searchType) {
            case 1:
            case 2: //testo
                form += '<input type="text" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+key+'">';
            break;
            case 3: //lista di valori
                form += '<input type="text" name="'+property.name+'" fieldId="'+property.fieldId+'" searchType="'+property.searchType+'" id="search_form_input_'+key+'"  style="width:300px;">';
            break;
            case 4: //numero
                form += '<div class="form-inline">'+
                    '<select name="'+property.name+'_operator" class="form-control">'+
                    '<option value="'+OpenLayers.Filter.Comparison.EQUAL_TO+'">=</option>'+
                    '<option value="'+OpenLayers.Filter.Comparison.NOT_EQUAL_TO+'">!=</option>'+
                    '<option value="'+OpenLayers.Filter.Comparison.LESS_THAN+'">&lt;</option>'+
                    '<option value="'+OpenLayers.Filter.Comparison.GREATER_THAN+'">&gt;</option>'+
                    '</select>'+
                    '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+key+'">'+
                    '</div>';
            break;
            case 5: //data
                form += '<input type="date" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+key+'">';
            break;
            case 6: //lista di valori non wfs
                form += '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" fieldFilter="'+property.fieldFilter+'" id="search_form_input_'+key+'" style="width:300px;">';
            break;
        }

        form += '</td></tr>';
    });
    form += '</table>';

    if (!hasProperties) {
        $('#ricerca').empty().append('<div>Nessun campo applicabile per la ricerca freqi/sezioni</div>');
        $('#SearchWindow').modal('show');
        return;
    }

    if ($.mobile) {
        form += '<button type="submit" class="btn btn-default ui-btn ui-shadow ui-corner-all">Cerca</button>'
    }
    else {
        form += '<button type="submit" class="btn btn-default">Cerca</button>'
    }

    form += '</form>';

    $('#ricerca').empty().append(form);

    $('#ricerca input[searchType="3"],#ricerca input[searchType="6"]').each(function(e, input) {
        var fieldId = $(input).attr('fieldId');
        var fieldFilter = $(input).attr('fieldFilter');
        $(input).select2({
            minimumInputLength: 0,
            query: function(query) {
                var filterValue = '';
                var filterFields = '';
                var fieldFilterTmp = fieldFilter;

                while (fieldFilterTmp !== 'undefined' && fieldFilterTmp !== null){
                    if ($('#ricerca input[fieldId="'+fieldFilterTmp+'"]').length === 0) {
                        break;
                    }
                    if (typeof $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== null) {
                        var filterSelect = $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data');
                        filterValue +=  $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data').text + ',';
                        filterFields += fieldFilterTmp + ',';
                    }
                    fieldFilterTmp = $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').attr('fieldFilter');
                }
                if (filterValue.length > 0) {
                    filterValue = filterValue.slice(0, -1);
                    filterFields = filterFields.slice(0, -1);
                }

                if (typeof $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data') !== null)
                    $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data', null);


                $.ajax({
                    url: GisClientMap.baseUrl + 'services/xSuggest.php',
                    data: {
                        suggest: query.term,
                        field_id: fieldId,
                        filterfields: filterFields,
                        filtervalue: filterValue
                    },
                    dataType: 'json',
                    success: function(data) {
                        var results = [];
                        $.each(data.data, function(e, val) {
                            results.push({
                                id: val.value,
                                text: val.value
                            });
                        });
                        query.callback({results:results});
                    }
                });
            }
        });
    });

    $('#ricerca input').change(function() {
        var ctrlId = $(this).attr('id');
        $('#ricerca input[id!="'+ctrlId+'"]').not('[id*="id_autogen"]').each(function(e, input) {
            var fieldType = $(input).attr('searchType');
            if (fieldType == '3' || fieldType == '6') {
                $(input).select2('data', null);
            }
            else {
                $(input).val("");
            }
        });
        if (typeof(fieldName1n) != 'undefined' && fieldName1n != null) {
            parentData = {};
            $('.modEEfields1nRow').remove();
            var fldValue = $(this).val();
            if(!fldValue || fldValue == '') return;

            var fldName = $(this).attr('name');
            var fldType = '=';
            var searchType = $(this).attr('searchType');

            if(searchType == 4) {
                fldType = $('#ricerca select[name="'+name+'_operator"]').val();
            }
            if(searchType == 2) {
                fldType = ' LIKE ';
                fldValue = '%'+fldValue+'%';
            }

            if(!fldName || typeof(fldName) == 'undefined') return;

            var params = {
                featureType: '',
                srid: GisClientMap.map.projection,
                projectName : GisClientMap.projectName,
                mapsetName : GisClientMap.mapsetName,
                query: fldName+fldType+':param_1',
                values: {'param_1': fldValue}
            };
            if (typeof(relationName1n) != 'undefined' && relationName1n != null) {
                params.relationName = relationName1n;
                params.action = 'show1nrelations';
                params.orderby = fieldName1n;
            }
            $('#LoadingReports').modal('show');
            for (var k = 0; k < arrSearchLayers.length; k++) {
                params.featureType = arrSearchLayers[k];
                $.ajax({
                    url: clientConfig.GISCLIENT_URL + '/services/xMapQuery.php',
                    method: 'POST',
                    dataType: 'json',
                    data: params,
                    beforeSend:function(jqXHR){
                        jqXHR.featureType=arrSearchLayers[k];
                    },
                    success: function(response, textStatus, jqXHR) {
                        if(!response || typeof(response) != 'object') {
                            return alert('Errore di sistema');

                        }
                        if(!response.length) {

                            return;
                        }
                        var fieldLabel = fieldLabel1n == null ? fieldName1n : fieldLabel1n;
                        var len = response.length, result, i, fieldsHTML = '';
                        for(i = 0; i < len; i++) {
                            result = response[i];
                            fieldsHTML += '<tr class="modEEfields1nRow"><td></td><td>';
                            fieldsHTML += '<input type="checkbox" name="'+fieldName1n+'" value="'+result[fieldName1n]+'" searchType="7" id="search_form_input_1n_'+i+'" class="justiren-routefilter_type7_ctrl"><label for="search_form_input_1n_'+i+'">'+result[fieldLabel]+'</label>';
                            fieldsHTML += '</td></tr>';
                        }
                        if (fieldsHTML.length > 0) {
                            fieldsHTML = '<tr class="modEEfields1nRow"><td>Circuiti</td><td><a href="#" id="justiren-routefilter_search_type7_select_btn" class="olButton fldType7Select"><span></span></a></td></tr>' + fieldsHTML;
                            $('#justiren-routefilter_search_table').append(fieldsHTML);
                            if ($.mobile) {
                                $('.justiren-routefilter_type7_ctrl').checkboxradio();
                            }
                            $('.justiren-routefilter_type7_ctrl').change(function() {
                                if ($('.justiren-routefilter_type7_ctrl:checkbox:checked').length == len) {
                                    $('#justiren-routefilter_search_type7_select_btn').removeClass('fldType7Select');
                                    $('#justiren-routefilter_search_type7_select_btn').addClass('fldType7Unselect');
                                }
                                else {
                                    $('#justiren-routefilter_search_type7_select_btn').removeClass('fldType7Unselect');
                                    $('#justiren-routefilter_search_type7_select_btn').addClass('fldType7Select');
                                }
                            });
                            $('#justiren-routefilter_search_type7_select_btn').click(function(event) {
                                event.preventDefault();
                                if ($(this).hasClass('fldType7Select')) {
                                    if ($.mobile) {
                                        $('.justiren-routefilter_type7_ctrl:checkbox').prop('checked', true).checkboxradio( "refresh" );
                                    }
                                    else {
                                        $('.justiren-routefilter_type7_ctrl:checkbox').prop('checked', true);
                                    }
                                    $(this).removeClass('fldType7Select');
                                    $(this).addClass('fldType7Unselect');
                                }
                                else {
                                    if ($.mobile) {
                                        $('.justiren-routefilter_type7_ctrl:checkbox').prop('checked', false).checkboxradio( "refresh" );
                                    }
                                    else {
                                        $('.justiren-routefilter_type7_ctrl:checkbox').prop('checked', false);
                                    }
                                    $(this).removeClass('fldType7Unselect');
                                    $(this).addClass('fldType7Select');
                                }
                            });
                        }
                        parentData.featureType = jqXHR.featureType;
                        for (var j=0; j<clientConfig.JUSTIREN_ROUTEFILTER_ROUTE_DISPLAY_FIELDS.length; j++) {
                            if (result.hasOwnProperty(clientConfig.JUSTIREN_ROUTEFILTER_ROUTE_DISPLAY_FIELDS[j])) {
                                parentData[clientConfig.JUSTIREN_ROUTEFILTER_ROUTE_DISPLAY_FIELDS[j]] = result[clientConfig.JUSTIREN_ROUTEFILTER_ROUTE_DISPLAY_FIELDS[j]];
                            }
                        }
                        $('#LoadingReports').modal('hide');
                    },
                    error: function() {

                    }
                });
            }
        }
    });

    $('#ricerca button[type="submit"]').click(function(event) {
        event.preventDefault();
        var fldName, fldValue = null, fldType, fldLogicOp = null, fldNameParent = null, fldTypeParent = null, fldValueParent = null;
        $('#ricerca input[gcfilter!="false"]').each(function(e, input) {
            var tmpValue = $(input).val();
            if(!tmpValue || tmpValue == '') return;
            var searchType = $(input).attr('searchType');

            switch (searchType) {
                case '4':
                fldName = $(input).attr('name');
                fldType = $('#ricerca select[name="'+name+'_operator"]').val();
                fldValue = tmpValue;
                formData[searchType] = {fldName: fldName, fldType:fldType, fldValue:fldValue};
                break;
                case '2':
                fldName = $(input).attr('name');
                fldType = ' LIKE ';
                fldValue = '%'+tmpValue+'%';
                formData[searchType] = {fldName: fldName, fldType:fldType, fldValue:fldValue};
                break;
                case '7':
                if ($(input).prop('checked')) {
                    if (!Array.isArray(fldName)) {
                        fldNameParent = fldName;
                        fldTypeParent = fldType;
                        fldValueParent = fldValue;
                        fldName = [$(input).attr('name')];
                        fldType = ['='];
                        fldValue = [tmpValue];
                        fldLogicOp = 'OR';
                        formData[searchType] = {};
                    }
                    else {
                        fldName.push($(input).attr('name'));
                        fldType.push('=');
                        fldValue.push(tmpValue);
                    }
                    formData[searchType][tmpValue] = {fldLabel: $(input).prop('labels')[0].innerText, fldType:'=', fldName:$(input).attr('name'), fldValue:tmpValue};
                }
                break;
                default:
                fldName = $(input).attr('name');
                fldType = '=';
                fldValue = tmpValue;
                formData[searchType] = {fldName: fldName, fldType:fldType, fldValue:fldValue};
            }
         });

        if(!fldValue || fldValue == '') return alert('Specificare almeno un parametro di ricerca');

        if (parentData.hasOwnProperty('featureType') && !formData.hasOwnProperty('7')) return alert('Selezionare almeno un valore di tipo checkbox');

        window.GCComponents.Functions.JUSTIrenRouteFilterClear();
        window.GCComponents.Data.JUSTIrenRouteFilter.parentData = parentData;
        window.GCComponents.Data.JUSTIrenRouteFilter.formData = formData;
        searchFunction.call(this,objLayers,fldName,fldValue,fldType,fldLogicOp, fldNameParent, fldTypeParent, fldValueParent);

        $('#SearchWindow').modal('hide');
    });

    $('#SearchWindow').modal('show');
}

window.GCComponents.Functions.JUSTIrenRouteFilterExecute = function(objLayers, idField, idValue, queryOp, queryLogicOp, idFieldParent, queryOpParent, idValueParent) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-routefilter-highlight')[0];
    window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests = 0;
    if (objLayers.hasOwnProperty('LAYERS')) {
        window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests = Object.keys(objLayers.LAYERS).length;
    }
    if (!Array.isArray(idField)) idField = [idField];
    if (idField.length == 0 || window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests == 0) {
        //window.GCComponents.Functions.modEESectionsPanel(null);
        loadingControl.minimizeControl();
        return;
    }
    if (!Array.isArray(idValue)) idValue = [idValue];
    queryOp = typeof(queryOp) !== 'undefined' ? queryOp : '=';
    queryLogicOp = typeof(queryLogicOp) !== 'undefined' ? queryLogicOp : 'AND';
    if (!Array.isArray(queryOp)) queryOp = [queryOp];

    var reqQuery = '', fldValues = {}, fldClassify = null;
    for (var i=0; i<idField.length; i++) {
        if (i>0) reqQuery += ' ' + queryLogicOp + ' ';
        reqQuery += idField[i]+queryOp[i]+':param_'+i;
        fldValues['param_'+i] = idValue[i];
        fldClassify = idField[i];
    }

    $.each(objLayers.LAYERS, function(key,obj){
        var fTypeK = GisClientMap.getFeatureType(key);
        if(!fTypeK) return;

        var params = {
            srid: GisClientMap.map.projection,
            projectName : GisClientMap.projectName,
            mapsetName : GisClientMap.mapsetName,
            featureType : key
        };

        if (typeof(obj.SEARCH_RELATION) !== 'undefined' && obj.SEARCH_RELATION != null) {
            params.relationName = obj.SEARCH_RELATION;
            params.action = 'show1nrelations';
            params.orderby = 'gc_objid';
        }
        if (obj.SEARCH_FIELD != null) {
            reqQuery = '';
            if (idFieldParent && obj.SEARCH_FIELD == idFieldParent) {
                reqQuery = idFieldParent+queryOpParent+':param_1';
                fldValues = {};
                fldValues['param_1'] = idValueParent;
                fldClassify = null;
            }
            else {
                for (var i=0; i<idField.length; i++) {
                    if (i>0) reqQuery += ' ' + queryLogicOp + ' ';
                    reqQuery += obj.SEARCH_FIELD+queryOp[i]+':param_'+i;
                    fldClassify = obj.SEARCH_FIELD;
                }
            }
        }
        params.query = '('+reqQuery+')';
        params.values = fldValues;

        $.ajax({
            url: clientConfig.GISCLIENT_URL + '/services/xMapQuery.php',
            method: 'POST',
            dataType: 'json',
            data: params,
            beforeSend:function(jqXHR){
                jqXHR.featureType=key;
                if (fldClassify) {
                    jqXHR.fldClassify = fldClassify;
                }
            },
            success: function(response, textStatus, jqXHR) {
                var fLayers = objLayers.LAYERS[jqXHR.featureType].FILTER_LAYERS,
                    idField = objLayers.LAYERS[jqXHR.featureType].FILTER_FIELD,
                    layersEnable = objLayers.TREE_LAYERS_ENABLE,
                    layersDisable = objLayers.TREE_LAYERS_DISABLE,
                    idList = [];
                var hDisplayFields = objLayers.LAYERS[jqXHR.featureType].hasOwnProperty('DISPLAY_FIELDS') ? objLayers.LAYERS[jqXHR.featureType].DISPLAY_FIELDS: null;

                if(!response || typeof(response) != 'object') {
                    alert('Errore di sistema, layer:' + jqXHR.featureType);
                    window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests--;
                }
                else if(!response.length) {
                    if (fLayers && fLayers.length > 0) {
                        window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers = window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers.concat(fLayers);
                        window.GCComponents.Functions.JUSTIrenRouteFilterSet(fLayers, idField, idList);
                    }
                    window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests--;
                }
                else {
                    var len = response.length, result, i, geometry, features = [], routeDataObj;

                    for(i = 0; i < len; i++) {
                        result = response[i];

                        routeDataObj = window.GCComponents.Data.JUSTIrenRouteFilter.parentData;
                        if (jqXHR.fldClassify != null) {
                            if (result.hasOwnProperty(jqXHR.fldClassify)) {
                                if (!window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq.hasOwnProperty(result[jqXHR.fldClassify])) {
                                    window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq[result[jqXHR.fldClassify]] = {};
                                }
                                routeDataObj = window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq[result[jqXHR.fldClassify]];
                            }
                        }
                        $.each(objLayers.COUNT_FEATURES_TOTAL, function(key,obj){
                            if (!routeDataObj.hasOwnProperty(obj.FIELD)) {
                                routeDataObj[obj.FIELD] = 0;
                            }
                            if (obj.LAYERS.indexOf(jqXHR.featureType) > -1) {
                                routeDataObj[obj.FIELD]++;
                            }
                        });
                        $.each(objLayers.COUNT_FIELDS_TOTAL, function(key,obj){
                            if (!routeDataObj.hasOwnProperty(obj.FIELD)) {
                                routeDataObj[obj.FIELD] = 0;
                            }
                            if (result.hasOwnProperty(obj.FIELD)) {
                                var tmpVal = parseFloat(result[obj.FIELD]);
                                if (isNaN(tmpVal)) {
                                    return;
                                }
                                routeDataObj[obj.FIELD] += tmpVal;
                            }
                        });

                        if (fLayers && fLayers.length > 0) {
                            geometry = result.gc_geom && OpenLayers.Geometry.fromWKT(result.gc_geom);
                            if(!geometry) continue;
                            if (!GisClientMap.map.getMaxExtent().containsBounds(geometry.getBounds())) continue;
                            delete result.gc_geom;
                            result.color = clientConfig.JUSTIREN_ROUTEFILTER_HIGHLIGHT_COLOR;
                            result.width = clientConfig.JUSTIREN_ROUTEFILTER_HIGHLIGHT_WIDTH;
                            result.maxscale = clientConfig.JUSTIREN_ROUTEFILTER_HIGHLIGHT_MAXSCALE;
                            result.minscale = clientConfig.JUSTIREN_ROUTEFILTER_HIGHLIGHT_MINSCALE;
                            result.visible = 1;
                            if (hDisplayFields) {
                                $.each(hDisplayFields, function(key, val){
                                    result[key] = val;
                                });
                            }
                            feature = new OpenLayers.Feature.Vector(geometry, result);
                            feature.featureTypeName = jqXHR.featureType;
                            features.push(feature);

                            if (result.hasOwnProperty(idField)) {
                                if (idList.indexOf(result[idField]) < 0) {
                                    idList.push(result[idField]);
                                }
                            }
                        }
                    }
                    highlightLayer.addFeatures(features);
                    window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers = window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers.concat(fLayers);
                    window.GCComponents.Functions.JUSTIrenRouteFilterSet(fLayers, idField, idList);
                    window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests--;
                }

                if (window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests <=0) {
                    loadingControl.minimizeControl();

                    if (highlightLayer.features.length == 0) {
                        window.GCComponents.Functions.JUSTIrenRouteFilterClear();
                        alert ('Nessun risultato');
                    }
                    else {
                        // **** Relod filtered layers
                        highlightLayer.refresh();
                        window.GCComponents.Functions.JUSTIrenRouteFilterToggleLayers(layersEnable,layersDisable);
                        var config = {layers: objLayers,
                                      parentData: window.GCComponents.Data.JUSTIrenRouteFilter.parentData,
                                      formData: window.GCComponents.Data.JUSTIrenRouteFilter.formData
                                  };
                        window.GCComponents.Functions.JUSTIrenRouteFilterPanel(config);
                    }
                }
            },
            error: function() {
                alert('Errore di sistema');
                window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests--;
                if (highlightLayer.features.length == 0) {
                    alert ('Nessun risultato');
                }
            }
        });
    });
};


window.GCComponents.Functions.JUSTIrenRouteFilterToggleLayers = function (layersEnable, layersDisable) {
    var tNode = null;
    var gcLayerTree = GisClientMap.map.getControlsByClass('OpenLayers.Control.LayerTree')[0];
    var gcLayer = null;
    var layerParts = [];
    var layerId = '';
    if (Array.isArray(layersDisable)) {
        for (var idx = 0; idx < layersDisable.length; idx++) {
            layerParts = layersDisable[idx].split(':');
            gcLayer = GisClientMap.map.getLayersByName(layerParts[0]);
            if (!gcLayer || gcLayer.length < 1) {
                continue;
            }
            layerParts.shift();
            layerId = (layerParts.length > 0 ? gcLayer[0].id + '_' + layerParts.join('_') :  gcLayer[0].id);
            tNode = gcLayerTree.overlayTree.tree('find',layerId);
            if (tNode) {
                gcLayerTree.changeNodeState(tNode, true);
                gcLayerTree.overlayTree.tree('uncheck',tNode.target);
                gcLayerTree.checkLayerNodeState(gcLayer[0]);
            }
        }
    }
    if (Array.isArray(layersEnable)) {
        for (var idy = 0; idy < layersEnable.length; idy++) {
            layerParts = layersEnable[idy].split(':');
            gcLayer = GisClientMap.map.getLayersByName(layerParts[0]);
            if (!gcLayer || gcLayer.length < 1) {
                continue;
            }
            layerParts.shift();
            layerId = (layerParts.length > 0 ? gcLayer[0].id + '_' + layerParts.join('_') :  gcLayer[0].id);
            tNode = gcLayerTree.overlayTree.tree('find',layerId);
            if (tNode) {
                gcLayerTree.changeNodeState(tNode, true);
                gcLayerTree.overlayTree.tree('check',tNode.target);
                gcLayerTree.checkLayerNodeState(gcLayer[0]);
            }
        }
    }
};

window.GCComponents.Functions.JUSTIrenRouteFilterSet = function (layerName, idField, idValue) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();
    if (layerName == null) {
        return;
    }
    if (Array.isArray(layerName)) {
        if (layerName.length == 0) {
            loadingControl.minimizeControl();
            return;
        }
        layerName = layerName.join();
    }
    var params = {
        featureType: layerName,
        projectName : GisClientMap.projectName,
        mapsetName : GisClientMap.mapsetName,
        action: 'set'
    };
    if (Array.isArray(idValue)) {
        if (idValue.length == 0) idValue = [0];
        params.filter = "('["+idField+"]'='"+idValue[0]+"'";
        for (var i=1; i<idValue.length; i++) {
            params.filter += " OR '["+idField+"]'='"+idValue[i]+"'";
        }
        params.filter += ")";
    }
    else if (idValue != null) {
        params.filter = "('["+idField+"]'='"+idValue+"')";
    }

    $.ajax({
        url: clientConfig.GISCLIENT_URL + '/services/gcFilterLayer.php',
        method: 'POST',
        dataType: 'json',
        data: params,
        success: function(response) {
            if(!response || typeof(response) != 'object') {
                return alert('Errore di sistema');
                loadingControl.minimizeControl();
            }
            if (window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests <=0) {
                loadingControl.minimizeControl();
            }
        },
        error: function() {
            if (window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests <=0) {
                loadingControl.minimizeControl();
            }
        }
    });
}

window.GCComponents.Functions.JUSTIrenRouteFilterPanel = function (config) {
    if (config == null) {
        $('#justiren-routefilter_panel_parent_content').html('');
        $('#justiren-routefilter_panel_content').html('');
        $('#justiren-routefilter_panel').css('height', 'auto');
        $('#justiren-routefilter_panel').css('display', 'none');
        return;
    }
    $('#justiren-routefilter_panel').css('height', 'auto');
    var panelTitle = 'Itinerario Filtrato';
    $('#justiren-routefilter_panel_title').html(panelTitle);
    $('#justiren-routefilter_panel_parent_content').html('');
    $('#justiren-routefilter_panel_content').html('');
    var panelParentContent = '';
    var panelContent = '';
    if (config.hasOwnProperty('parentData')) {
        if (config.parentData.hasOwnProperty('featureType')) {
            var fTypeP = GisClientMap.getFeatureType(config.parentData.featureType);
            for (var i=0; i<fTypeP.properties.length; i++) {
                if (clientConfig.JUSTIREN_ROUTEFILTER_ROUTE_DISPLAY_FIELDS.some(function(arrVal) {
                    return fTypeP.properties[i].name === arrVal;
                    })) {
                    var format = typeof(fTypeP.properties[i].fieldFormat) != 'undefined'?fTypeP.properties[i].fieldFormat:null;
                    var value = config.parentData[fTypeP.properties[i].name];
                    if (format && typeof(value) != 'undefined') {
                        value = sprintf(format, value);
                    }
                    panelParentContent += '<div><span class="freq_data_header">' + fTypeP.properties[i].header + '</span><span class="freq_data_content">' + value + '</span></div>';
                }
            }
            $('#justiren-routefilter_panel_parent_content').html(panelParentContent);
        }
    }
    var arrFreqList = Object.keys(window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq).map(function (key) { return key; }).sort();
    $.each(arrFreqList, function(idx, freqIDX) {
        var freq = window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq[freqIDX];
        var freqHeader = config.formData['7'][freqIDX].fldLabel;
        panelContent += '<div><a href="#" class="justiren-routefilter_panel_toggle" freqID="'+freqIDX+'"><span class="justiren-routefilter_panel_toggle_icon icon-hide-panel" style="margin-left: 10px;"></span></a>\
                        <span class="justiren-routefilter_panel_separator"></span></div>';
        panelContent += '<div id="justiren-routefilter_panel_'+freqIDX+'">';
        panelContent += '<div id="mod_ee_freq_panel_section_div_'+freqIDX+'" class="freq_section_container"><div><span class="freq_data_header">Frequenza</span><span class="freq_data_content">' + freqHeader +'</a></span></div></div>';
        $.each(config.layers.COUNT_FEATURES_TOTAL, function(key,obj){
            var fValue = freq[obj.FIELD];
            if (!fValue) return;
            var fLabel = obj.LABEL;
            var fFormat = obj.FORMAT;
            if (fFormat && typeof(fValue) != 'undefined') {
                fValue = sprintf(fFormat, fValue);
            }
            panelContent += '<div><span class="freq_data_header">' + fLabel + '</span><span class="freq_data_content">' + fValue + '</span></div>';
        });
        $.each(config.layers.COUNT_FIELDS_TOTAL, function(key,obj){
            var fValue = freq[obj.FIELD];
            if (!fValue) return;
            var fLabel = obj.LABEL;
            var fFormat = obj.FORMAT;
            if (fFormat && typeof(fValue) != 'undefined') {
                fValue = sprintf(fFormat, fValue);
            }
            panelContent += '<div><span class="freq_data_header">' + fLabel + '</span><span class="freq_data_content">' + fValue + '</span></div>';
        });
        panelContent += '</div>';
    });
    $('#justiren-routefilter_panel_content').html(panelContent);
    var panelSize = $('#justiren-routefilter_panel').height();
    var maxPanelSize = $('#map').height() - 50;
    if (panelSize > maxPanelSize) {
        $('#justiren-routefilter_panel').css('height', maxPanelSize);
        $('#justiren-routefilter_panel').css('overflow', 'auto');
    }
    $("#justiren-routefilter_panel_content a").click(function() {
        event.stopPropagation();
        if ($(this).hasClass("justiren-routefilter_panel_toggle")) {
            var circDisplay = '';
            var circColor = null;
            var freqID = this.getAttribute('freqID');
            var spanItem = $(this).find('.justiren-routefilter_panel_toggle_icon')[0];
            if ($(spanItem).hasClass('icon-hide-panel')) {
                $(spanItem).removeClass('icon-hide-panel');
                $(spanItem).addClass('icon-show-panel');
                circDisplay = 'none';
                circColor = '#FFFFFF';

            }
            else {
                $(spanItem).removeClass('icon-show-panel');
                $(spanItem).addClass('icon-hide-panel');
                circDisplay = 'block';
            }
            $('#justiren-routefilter_panel_'+freqID).css('display', circDisplay);
        }
        else {
            $("#justiren-routefilter_panel_content a").removeClass("olControlItemActive");
            $("#justiren-routefilter_panel_content a").addClass("olControlItemInactive");
            $(this).removeClass("olControlItemInactive");
            $(this).addClass("olControlItemActive");
        }
    });
    $('#justiren-routefilter_panel').css('display', 'block');
};

window.GCComponents.Functions.JUSTIrenRouteFilterClear = function() {
    window.GCComponents.Functions.JUSTIrenRouteFilterSet(window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers);
    window.GCComponents.Functions.JUSTIrenRouteFilterPanel();
    window.GCComponents.Data.JUSTIrenRouteFilter = {};
    window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers = [];
    window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq = {};
    window.GCComponents.Data.JUSTIrenRouteFilter.pendingRequests = 0;
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-routefilter-highlight')[0];
    highlightLayer.removeAllFeatures();
    highlightLayer.redraw();
    window.GCComponents.Functions.JUSTIrenRouteFilterToggleLayers(clientConfig.JUSTIREN_ROUTEFILTER_TREE_LAYERS_ENABLE, clientConfig.JUSTIREN_ROUTEFILTER_TREE_LAYERS_DISABLE);
}

window.GCComponents.InitFunctions.JUSTIrenRouteFilterInit = function() {
    if (!window.GCComponents.hasOwnProperty('Data')) {
        window.GCComponents.Data = {JUSTIrenRouteFilter:{}};
    }
    else {
        window.GCComponents.Data.JUSTIrenRouteFilter = {};
    }
    window.GCComponents.Data.JUSTIrenRouteFilter.bboxGeom = null;
    window.GCComponents.Data.JUSTIrenRouteFilter.filterLayers = [];
    window.GCComponents.Data.JUSTIrenRouteFilter.filterFreq = {};

    // **** Configure highlight layer
    var ruleDisplayPoint = new OpenLayers.Rule({
        maxScaleDenominator: "${maxscale}",
        minScaleDenominator: "${minscale}",
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.EQUAL_TO,
            property: "visible",
            value: 1,
        }),
        symbolizer: {display: ''}
    });
    var ruleHidePoint = new OpenLayers.Rule({
        elseFilter: true,
        symbolizer: {display: 'none'}
    });

    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-routefilter-highlight')[0];
    highlightLayer.styleMap.styles.default.addRules([ruleDisplayPoint, ruleHidePoint]);
}

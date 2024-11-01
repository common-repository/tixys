/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, JSON */

/*!
Copyright (c) 2012-2015 AGITsol GmbH. Subject to the MIT licence. see tx.page.src.js for source.
*/

/*
    Copyright (c) 2012-2015 AGITsol GmbH

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

jQuery(document).ready(function($){
    var
        executeCall = function(endpoint, request, $ind, callback)
        {
            request.set('Site', Tx.config.site);

            endpoint.setParam('dataType', 'jsonp');
            endpoint.setRequest(request);
            endpoint.setIndicator(new Tx.IndicatorSpinner($ind));
            endpoint.setMessageHandler(new Tx.MessageAlert());
            endpoint.setCallback(callback);
            endpoint.execute();
        },

        onChangeStationFrom = function(txForm, $selectFrom, $selectTo, $indicatorTo)
        {
            var stationFrom = Tx.toInt($selectFrom.val());

            if (!stationFrom)
            {
                fillSelect($selectTo, []);
            }
            else if (!txForm.to)
            {
                executeCall(
                    new Tx.Endpoint('shop.v1/Station.searchDestinations'),
                    new Tx.RequestObject('shop.v1/StationSearch', { Station : stationFrom }),
                    $indicatorTo,
                    function(res) { fillSelect($selectTo, res.itemList); }
                );
            }
        },

        onSubmitForm = function(ev, txForm, $selectFrom, $selectTo)
        {
            var
                stationFrom = txForm.from || Tx.toInt($selectFrom.val()),
                stationTo = txForm.to || Tx.toInt($selectTo.val());

            if (!stationFrom || !stationTo)
            {
                alert(Tx.out("[:en]Please select a start and a destination station.[:de]Bitte wählen Sie eine Start- und eine Zielhaltestelle."));
                Tx.stopEvent(ev);
            }
        },

        fillSelect = function($elem, resultList)
        {
            $elem.empty().attr('disabled', resultList.length ? false : 'disabled');

            if (resultList.length)
            {
                $elem.append(Tx.sprintf("<option value='%s'>%s</option>", 0, Tx.out("[:en]– Please select –[:de]– Bitte wählen –")));
                $.each(resultList, function(k, entry){
                    $elem.append(Tx.sprintf("<option value='%s'>%s</option>", entry.id, Tx.out(entry.name)));
                });
            }
        },

        isDe = Tx.config.locale.substr(0,2) === 'de';

    $('form.tixys-search').each(function(){
        var
            $form = $(this).attr('action', Tx.config.urlBase),
            txForm = txForms[$form.attr('data-txform')],
            $inputDate = $form.find('input.tixys-select-day'), // the visible input
            $inputDay = $form.find('input[name=day]'), // the actual input with the formatted value
            $selectFrom = $form.find('select.tixys-select-station-from'),
            $indicatorFrom = $form.find('img.tixys-from'),
            $selectTo = $form.find('select.tixys-select-station-to'),
            $indicatorTo = $form.find('img.tixys-to');

        $form.submit(function(ev) { onSubmitForm(ev, txForm, $selectFrom, $selectTo) });
        $selectFrom.change(function(ev) { onChangeStationFrom(txForm, $selectFrom, $selectTo, $indicatorTo) });

        if (txForm.datepicker)
        {
            $inputDate.datepicker({
                dateFormat : isDe ? 'dd.mm.yy' : 'yy-mm-dd',
                firstDay: isDe ? 1 : 0,
                minDate: 0,
                altField: $inputDay,
                altFormat: 'yy-mm-dd'
            }).datepicker('setDate', new Date());
        }
    });
});

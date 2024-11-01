/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, Globalize, OpenLayers, JSON */

Tx.AjaxCall = function()
{
    var
        params = {
            url            : '',
            request        : '',
            indicator      : null,
            messageHandler : new Tx.MessageAlert(),
            dataType       : 'json',
            callback       : Tx.nullFunc,
            processType    : 'api'  // 'api', 'apicomplete', or 'raw'. with 'api*', we expect an API response and will preprocess it
        },

        checkResult = function(res)
        {
            if (!res ||
                typeof(res) !== 'object' ||
                Tx.isUndefined(res.payload) ||
                Tx.isUndefined(res.MessageList))
            {
                res =
                {
                    success : false,
                    payload : [],
                    MessageList : [{type: "error", source: "system", text: Tx.L10n.t("Call failed or returned an invalid response.")}]
                };
            }

            return res;

        },

        processPayload = function(payload, entityList)
        {
            var
                pattern = /#e#:[0-9]+/,
                denormalize = function(value)
                {
                    var
                        type = jQuery.type(value),
                        newValue = value;

                    if (type === 'object')
                    {
                        newValue = {};
                        jQuery.each(value, function(k, v){
                            newValue[k]= denormalize(v);
                        });
                    }
                    else if (type === 'array')
                    {
                        newValue = [];
                        jQuery.each(value, function(k, v){
                            newValue.push(denormalize(v));
                        });
                    }
                    else if (type === 'string' && value.match(pattern))
                    {
                        newValue = denormalize(entityList[value]);
                    }

                    return newValue;
                };

            return denormalize(payload);
        },

        processMessages = function(_MessageList)
        {
            var i=0, MessageList = [], mh = params.messageHandler;

            if (mh.reset)
            {
                mh.reset();
            }

            if (_MessageList.length > 0)
            {
                for (i; i<_MessageList.length; i++)
                {
                    MessageList.push(new Tx.UserMessage(
                        _MessageList[i].type,
                        _MessageList[i].source,
                        _MessageList[i].text
                    ));
                }

                mh.setMessages(MessageList);
                mh.showMessages();
            }
        },
        combinedCb = function(_res)
        {
            var res = _res;

            if (Tx.inArray(params.processType, ['api', 'apicomplete']))
            {
                res = checkResult(_res);
                processMessages(res.MessageList);
                res.payload = processPayload(res.payload, res.entityList);
                params.callback(params.processType === 'api' ? res.payload : res);
            }
            else if (params.processType === 'raw')
            {
                params.callback(res);
            }

            if (params.indicator)
            {
                params.indicator.finish();
            }
        };

    this.setParam = function(name, value)
    {
        if (!Tx.isUndefined(params[name]))
        {
            params[name] = value;
        }
    };

    this.getParam = function(name)
    {
        return (!Tx.isUndefined(params[name]))
            ? params[name]
            : null;
    };

    this.doCall = function()
    {
        var
            ajaxOpts = {
                type         : 'POST',
                url          : params.url,
                data         : params.request,
                success      : combinedCb,
                error        : combinedCb,
                dataType     : params.dataType,
                cache        : false,
                timeout      : 120000
            };

        if (params.dataType === 'jsonp')
        {
            ajaxOpts.type = 'GET';
            ajaxOpts.url += '.jsonp';
        }

        if (Tx.token)
        {
            ajaxOpts.headers = { 'X-Token' : Tx.token };
        }

        jQuery.ajax(ajaxOpts);

        if (params.indicator)
        {
            params.indicator.show();
        }
    };
};

/*jslint white: true */
/*global Tx*/
Tx.ApiEndpoints = {
    "shop.v1\/Station.search": "shop.v1\/StationSearch",
    "shop.v1\/Station.searchDepartures": "shop.v1\/StationSearch",
    "shop.v1\/Station.searchDestinations": "shop.v1\/StationSearch",
    "shop.v1\/Station.get": "common\/Id"
};
/*jslint white: true */
/*global Tx*/
Tx.ApiObjects = {
    "shop.v1/Station": {
        "id": null,
        "name": null,
        "description": null,
        "lon": null,
        "lat": null,
        "timezone": null
    },
    "shop.v1/StationSearch": {
        "Site": null,
        "name": null,
        "Maparea": null,
        "Station": null
    }
};

/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, OpenLayers, JSON */

Tx.Endpoint = function(_reqEndpointName, _params)
{
    var
        params = _params || {},
        endpointExists = (typeof(Tx.ApiEndpoints[_reqEndpointName]) === 'string'),
        endpointName =  endpointExists ? _reqEndpointName : '',
        objectName = endpointExists ? Tx.ApiEndpoints[endpointName] : '',
        ajaxCall = new Tx.AjaxCall();

    if (!endpointExists)
    {
        throw Tx.sprintf("Invalid endpoint: %s", _reqEndpointName);
    }

    this.createRequestObject = function(data)
    {
        return new Tx.RequestObject(objectName, data);
    };

    this.execute = function()
    {
        var request = ajaxCall.getParam('request');
        request += (request.length ? '&' : '?') + "locale="+Tx.config.locale;

        ajaxCall.setParam('url', Tx.config.apiBase+'/'+endpointName);
        ajaxCall.setParam('request', request);
        ajaxCall.doCall();
    };

    this.setParam = function(name, value)
    {
        ajaxCall.setParam(name, value);
    };

    this.setRequest = function(requestObject)
    {
        if (typeof(requestObject) !== 'object' || typeof(requestObject.getName) !== 'function')
        {
            throw "Invalid request object.";
        }
        else if(requestObject.getName() !== objectName)
        {
            throw Tx.sprintf("Wrong request object, expected %s, got %s", objectName, requestObject.getName());
        }

        ajaxCall.setParam('request', 'request='+JSON.stringify(requestObject).replace(/\+/g, '%2b').replace(/&/g, '%26'));
    };

    this.setIndicator = function(indicator)
    {
        ajaxCall.setParam('indicator', indicator);
    };

    this.setMessageHandler = function(messageHandler)
    {
        ajaxCall.setParam('messageHandler', messageHandler);
    };

    this.setCallback = function(callback)
    {
        ajaxCall.setParam('callback', callback);
    };

    jQuery.each(params, function(key, value){
        ajaxCall.setParam(key, value);
    });
};


Tx.isNull = function(val)
{
    return (val === null);
};

Tx.isUndefined = function (val)
{
    return (val === undefined);
};

Tx.objectToArray = function(obj, keysOrValues)
{
    var values = [];

    jQuery.each(obj, function(key, value){
        values.push(keysOrValues && keysOrValues === 'keys' ? key : value);
    });

    return values;
};

Tx.getObjectKeys = function(obj)
{
    return Tx.objectToArray(obj, 'keys');
};

Tx.arrayMap = function(callback, arr)
{
    var i = 0;

    for (i; i<arr.length; i++)
    {
        arr[i] = callback(arr[i]);
    }
    return arr;
};

Tx.trim = function(string)
{
    if (Tx.isUndefined(string.replace))
    {
        string = string.toString();
    }

    string = string.replace(/^\s+/, '');
    string = string.replace(/\s+$/, '');

    return string;
};

Tx.toInt = function(val)
{
    var newVal;

    if (typeof(val) === 'boolean')
    {
        newVal = val ? 1 : 0;
    }
    else
    {
        if (typeof(val) === 'string')
        {
            val = val.replace(',', '.');
        }

        newVal = parseInt(val, 10);
    }

    if (isNaN(newVal))
    {
        newVal = 0;
    }

    return newVal;
};

Tx.toFloat = function(val)
{
    if (typeof(val) === 'string')
    {
        val = val.replace(',', '.');
    }

    var newVal = parseFloat(val);

    if (isNaN(newVal))
    {
        newVal = 0;
    }

    return newVal;
};

Tx.toBool = function(val)
{
    return !!Tx.toInt(val);
};

Tx.vsprintf = function(string, values)
{
    var i = 0;

    if (!values || !values.length)
    {
        return string;
    }

    for (i; i<values.length; i++)
    {
        string = string.replace(/%s/, values[i]);
    }

    return string;
};

Tx.sprintf = function(string)
{
    var args = [];

    jQuery.each(arguments, function(k, arg){
        if (k) { args.push(arg); }
    });

    return Tx.vsprintf(string, args);
};

Tx.stopEvent = function(ev)
{
    if (ev.preventDefault)
    {
        ev.preventDefault();
    }
    else
    {
        ev.returnValue = false;
    }
};


Tx.currencyFormat = function(val) // format currency xxx.xx
{
    var
        intpart    = Math.floor(val),
        fractpart  = val*100 - intpart*100;

    fractpart = Math.round(fractpart);

    if (fractpart === 0)    { fractpart = '00'; }
    else if (fractpart<10)  { fractpart = '0'+fractpart; }

    return intpart + Tx.L10n.tc(".|decimal separator") + fractpart;
};

Tx.varpad = function(_val, _num, _fill)
{
    var
        val = _val.toString(),
        num = _num || 2,
        fill = _fill ?  _fill.toString() : ' ',
        padChars = '';

    while (val.length < num)
    {
        val = fill + val;
    }

    return val;
};

Tx.numpad = function(val, _pad)
{
    return Tx.varpad(val, _pad, '0');
};

// jQ's inArray behaves stupid, we want a boolean value, so we use our own implementation
Tx.inArray = function(needle, haystack, _strict)
{
    var
        i = 0,
        strict = _strict || false,
        ret = false;

    if (!Tx.isUndefined(haystack) && !Tx.isNull(haystack))
    {
        jQuery.each(haystack, function(k, haystackElem){
            if ((strict && needle === haystackElem) || (!strict && needle == haystackElem))
            {
                ret = true;
                return false; // break
            }
        });
    }

    return ret;
};

Tx.collectFormValues = function($parent, _prefix)
{
    var values = {}, prefix = _prefix || '';

    jQuery($parent).find('input[name], select[name], textarea[name]').each(function(){
        var
            val = null,
            $this = jQuery(this),
            name = $this.attr('name');

        if ((prefix && name.indexOf(prefix) !== 0) || $this.attr('data-ignore') === 'true')
        {
            return;
        }

        name = name.substr(prefix.length);
        val = $this.getFieldValue();

        if (!Tx.isNull(val) && !Tx.isUndefined(val) && !Tx.isNull(name) && !Tx.isUndefined(name))
        {
            if (name.substr(-4, 4) === 'List' && !jQuery.isArray(val))
            {
                if (!jQuery.isArray(values[name]))
                {
                    values[name] = [];
                }

                values[name].push(val);
            }
            else
            {
                values[name] = val;
            }
        }
    });

    return values;
};

Tx.redirect = function(url)
{
    window.location.href = url;
};

// Can be used for empty callbacks
Tx.nullFunc = function() {};

Tx.appendParams = function(_url, _params, _enctype)
{
    var
        url      = _url || '',
        params   = _params || {},
        enctype  = _enctype || '',
        amp      = '&';

    if (enctype === 'html')
        { amp = '&amp;'; }
    else if (enctype === 'url')
        { amp = '%26'; }

    jQuery.each(params, function(key, value){
        url += (url.indexOf('?') === -1 ? '?' : amp) + Tx.sprintf('%s=%s', key, value);
    });

    return url;
};

Tx.findObjectInList = function(list, keyValue, _keyName)
{
    var i = 0, result = null, keyName = _keyName || 'id';

    for (i; i<list.length; i++)
    {
        // ckeck for equality, not identity ... e.g. sometimes JSON is not correctly serialized
        if (list[i][keyName] == keyValue)
        {
            result = list[i];
            break;
        }
    }

    return result;
};

Tx.removeObjectFromList = function(list, keyValue, _keyName)
{
    var i = 0, newList = [], keyName = _keyName || 'id';

    for (i; i<list.length; i++)
    {
        // ckeck for equality, not identity ... e.g. sometimes JSON is not correctly serialized
        if (list[i][keyName] != keyValue)
        {
            newList.push(list[i]);
        }
    }

    return newList;
};

Tx.findObjectsInList = function(list, keyValues, _keyName)
{
    var results = [], i=0, val, keyName = _keyName || 'id';

    for (i; i<keyValues.length; i++)
    {
        val = Tx.findObjectInList(list, keyValues[i], keyName);
        if (val && val[keyName])
        {
            results.push(val);
        }
    }
    return results;
};

Tx.esc = function(string)
{
    var replacements = { '<' : '&lt;', '>' : '&gt;', '"' : '&quot;', "'" : '&#038;' };

    jQuery.each(replacements, function(search, replace){
        if (typeof string === 'string')
        {
            string = string.replace(new RegExp(search, 'g'), replace);
        }
    });

    return string;
};


// this function returns strings that come from an untrusted source and
// makes them ready for being inserted in the HTML. This is done via filters.
// Filters are currently hardcoded, might become pluggable one day.
Tx.out = function(string)
{
    // filter: Tx.escape HTML special characters
    string = Tx.esc(string);

    // filter: translate multilang content
    if (window.Tx.L10n !== undefined)
    {
        string = Tx.L10n.mlStringTranslate(string, Tx.config.locale);
    }

    return string;
};
/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, OpenLayers, JSON */

Tx.L10n =
{
    t : function(_string)
    {
        return (!Tx.isUndefined(window.messages) && !Tx.isUndefined(window.messages[_string]))
            ? window.messages[_string]
            : _string;
    },

    tc : function(origString)
    {
        var
            string = Tx.L10n.t(origString),
            lastpipe = string.lastIndexOf('|');

        return (lastpipe === -1)
            ? string
            : string.slice(0, lastpipe);
    },

    tn : function(string, num) // works for most european languages
    {
        var
            tString = Tx.L10n.t(string),
            parts = tString.indexOf('|') > 0 ? tString.split('|') : [tString, tString];

        return Tx.sprintf((num === 1 ? parts[0] : parts[1]), num);
    },

    u : function(string) // just a shortcut
    {
        return Tx.L10n.mlStringTranslate(string, Tx.config.locale);
    },

    formatDay : function(Day, format)
    {
        return new Date(Day.y, Day.m - 1, Day.d).format(format || Tx.L10n.t("Y/m/d"));
    },

    formatTimeofday : function(Timeofday, format)
    {
        return new Date(2000, 1, 1, Timeofday.h, Timeofday.m).format(format || Tx.L10n.t("H:i"));
    },

    formatTime : function(Day, Timeofday, format)
    {
        return new Date(Day.y, Day.m - 1, Day.d, Timeofday.h, Timeofday.m).format(format || Tx.L10n.t("Y/m/d H:i"));
    },


    formatDuration : function(minutes)
    {
        var hours = Math.floor(minutes / 60);
        return Tx.sprintf("%sh %smin", hours, minutes - hours * 60);
    },


    mlStringToObj : function(string)
    {
        var
            regex = new RegExp('\\[:(?=[a-z]{2}\\])', 'g'),
            obj = {};

        if (typeof(string) === 'string')
        {
            jQuery.each(string.split(regex), function(k, part){
                var
                    key = part.substr(0, 2),
                    string = part.substr(3);

                if (part.length >= 3 && part.substr(0,3).match(/[a-z]{2}\]/))
                {
                    obj[key] = string;
                }
            });
        }

        return obj;
    },

    mlStringTranslate : function(string, locale)
    {
        var
            lang = locale.substr(0, 2),
            fallbackLang = Tx.config.locale.substr(0, 2),
            obj,
            outString = string;

        if (typeof(string) === 'string' && string.match(/\[:[a-z]{2}\]/))
        {
            obj = Tx.L10n.mlStringToObj(string);

            if (typeof(obj[lang]) === 'string')
            {
                outString = obj[lang];
            }
            else if (typeof(obj[fallbackLang]) === 'string')
            {
                outString = obj[fallbackLang];
            }
            else if (typeof(obj.en) === 'string')
            {
                outString = obj.en;
            }
            else
            {
                outString = '';
            }
        }

        return outString;
    }
};

// console.log(Tx.L10n.mlStringTranslate('[:de]foo[:en]bar', 'de_AT')); // 'foo'
// console.log(Tx.L10n.mlStringTranslate('[:de]foo[:en]bar', 'it_IT')); // 'foo'
// console.log(Tx.L10n.mlStringTranslate('[:de][:en]bar', 'de_DE')); // ''
// console.log(Tx.L10n.mlStringTranslate('[de]foo[:en]bar', 'de_DE')); // 'bar'
// console.log(Tx.L10n.mlStringTranslate('[defoo[:en]bar', 'de_DE')); // 'bar'
// console.log(Tx.L10n.mlStringTranslate('[:defoo[:en]bar', 'de_DE')); // 'bar'
// console.log(Tx.L10n.mlStringTranslate('foobar', 'de_DE')); // 'foobar'
//
// console.log(Tx.L10n.mlStringToObj('[:de]foo[:en]bar')); // { de : "foo", en : "bar" }
// console.log(Tx.L10n.mlStringToObj('[:de]foo[:en]bar')); // { de : "foo", en : "bar" }
// console.log(Tx.L10n.mlStringToObj('[:de][:en]bar')); // { de : "", en : "bar" }
// console.log(Tx.L10n.mlStringToObj('[de]foo[:en]bar')); // { en : "bar" }
// console.log(Tx.L10n.mlStringToObj('[defoo[:en]bar')); // { en : "bar" }
// console.log(Tx.L10n.mlStringToObj('[:defoo[:en]bar')); // { en : "bar" }
// console.log(Tx.L10n.mlStringToObj('foobar')); // { }

Tx.IndicatorNoop = function()
{
    var callback = Tx.nullFunc;

    this.setCallback = function(_callback)
    {
        callback = _callback;
    };

    this.show = Tx.nullFunc;

    this.finish = function(status)
    {
        callback();
    };
};
/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, Globalize, OpenLayers, JSON */

Tx.IndicatorSpinner = function($elem)
{
    var
        callback = Tx.nullFunc;

    this.setCallback = function(_callback)
    {
        callback = _callback;
    };

    this.show = function()
    {
        $elem.show();
    };

    this.finish = function(status)
    {
        $elem.hide();
        callback();
    };
};
/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, Globalize, OpenLayers, JSON */

Tx.MessageAlert = function()
{
    var messages = [];

    this.reset = Tx.nullFunc;

    this.setMessages = function(_messages)
    {
        messages = _messages;
    };

    this.showMessages = function()
    {
        var i = 0, msgList = [], msg = '';

        if (messages.length === 1)
        {
            msg = messages[0].getText();
        }
        else
        {
            for (i; i<messages.length; i++)
            {
                msgList.push("• " + messages[i].getText());
            }
            msg = msgList.join("\n");
        }

        alert(msg);
    };
};
/*jslint bitwise: false, continue: false, debug: false, eqeq: true, es5: false, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: true, undef: false, unparam: true, sloppy: true, stupid: false, sub: false, todo: true, vars: false, white: true, css: false, on: false, fragment: false, passfail: false, browser: true, devel: true, node: false, rhino: false, windows: false, indent: 4, maxerr: 100 */
/*global Tx, $, jQuery, OpenLayers, JSON */

Tx.RequestObject = function(name, _defaultFields)
{
    var
        self = this,
        defaultFields = _defaultFields || {},

        checkPropertyExists = function(key)
        {
            if (Tx.isUndefined(self[key]))
            {
                throw Tx.sprintf("Object %s does not have a property named %s.", name, key);
            }
        };

    if (Tx.isUndefined(Tx.ApiObjects[name]))
    {
        throw Tx.sprintf("Object does not exist: %s", name);
    }

    jQuery.each(Tx.ApiObjects[name], function(key, value){
        self[key] = Tx.isUndefined(defaultFields[key]) ? value : defaultFields[key];
    });

    this.set = function(key, value)
    {
        checkPropertyExists(key);
        self[key] = value;
    };

    this.get = function(key)
    {
        checkPropertyExists(key);
        return self[key];
    };

    this.getName = function()
    {
        return name;
    };
};

Tx.UserMessage = function(_type, _source, _text)
{
    var
        type = _type || 'info',
        text = _text || '',
        source = _source || 'user';

    this.getType = function()
    {
        return type;
    };

    this.getSource = function()
    {
        return source;
    };

    this.getText = function()
    {
        return text;
    };
};

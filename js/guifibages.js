$.ajaxSetup ({
    // Disable caching of AJAX responses
    cache: false
});
/** Fields access and definitions */
var fields = {
  homeDirectory: ["admin", "Directori d'usuari"],
  mail: ["user", "Correu electrònic"],
  street: ["user", "Adreça postal"],
  postalCode: ["user", "Codi Postal"],
  givenName: ["admin", "Nom"],
  l: ["user", "Població"],
  sn: ["admin", "Cognoms"],
  uid: ["admin", "Usuari"],
  loginShell: ["admin", "Shell"],
  uidNumber: ["admin", "uid"],
  telephoneNumber: ["user", "Telèfon"],
  userPassword: ["user", "contrasenya"],
  guifibagesPlaintextPassword: ["user", "contrasenya"],
  guifibagesApplicationPassword: ["user", "contrasenya"],
  roomNumber: ["user", "Guifi.net Node number"],
  organizationalStatus: ["admin", "Estat"],
}

var login_value, login_cookie, uid_list, original_user_data, api_endpoint
api_endpoint = "https://" + window.location.hostname +"/api/"
uid_list  = []
user_list = []
login_cookie = readCookie('login')

if (login_cookie != null) {
  console.log("login_cookie", login_cookie)
  login_value = JSON.parse(login_cookie)
  login()
  $('#logindiv').hide()
  $('form#user_form').show()
  $('#logoutdiv').show()
}


/**
 * Populate user_form
 * @param {string} uid
 */
function get_user(target) {
  $.post(api_endpoint + 'user/' + target +'/get', login_value, function(data){
    var user_values = JSON.parse(data)
    $('div#main').load("/html/userform.html", function() {
      $('form#user_form').reset()
      $('div#form-actions').affix()
      $('form#user_form').submit(function(){
        update_user()
        return false;
      })

      for (var k in user_values) {
        if (user_values.hasOwnProperty(k)) {
          // console.log(target, k, user_values[k][0])
          var inputfield = $('form#user_form input[name="' + k + '"]')
          if (k == 'organizationalStatus') {
            $('select#organizationalStatus').children('option').prop('selected', false)
            $('select#organizationalStatus').children('option[value="'+ user_values[k][0] +'"]').prop('selected', true)

          }
          if (k in fields) {
            var required_level = fields[k][0]
            var field = k
            var field_name = fields[k][1]
            inputfield.val(user_values[k][0])
            if (user_values['access_level'] == fields[k][0]) {
              inputfield.prop('disabled', false)
            } else {
              inputfield.prop('disabled', true)
            }
          }
        }
      }
      original_user_data = user_values
      if (user_values['access_level'] == 'admin') {
        $('form#user_form input').prop('disabled', false)
        $('form#user_form input').prop('required', false)
      }
      $('form#user_form').show()
    });

  });
}
var alert_tpl
$.get('alert.html', function(data){
  alert_tpl = $.parseHTML(data)
});
function showalert(alertstring, alertclass) {
  if (typeof(alertstring) == 'undefined') {
    console.log("showalert requires a parameter")
    return false
  }
  var alertdiv = $(alert_tpl).clone()
  if (typeof(alertclass) != 'undefined') {
    alertdiv.addClass('alert-' + alertclass)
  }
  alerttext=$('<span/>')

  alerttext.text(alertstring)
  alerttext.appendTo(alertdiv)
  alertdiv.appendTo($('#notifications'))
}

function add_user() {
  user_data = $('form#addUserForm').serializeObject()
  $.extend(user_data, login_value)
  $.post( api_endpoint + 'user/new', user_data, function(data){
    parsed = JSON.parse(data)
    get_users(parsed.uid)
    get_user(parsed.uid)
    console.log("new_user", data)
    $('#addUserModal').modal('hide')
    // get_user(parsed.original_record.uid)
  });
}

function update_user() {
  var parsed_form = parse_form('edit')
  // showalert("Canvis guardats correctament", "success")
  if (parsed_form == null) {
    showalert("No s'han fet canvis")
    return
  }
  var targetuser = $('input#targetuid').val()
  $.extend(parsed_form, login_value)

  $.post( api_endpoint + 'user/' + targetuser + '/update', parsed_form, function(data){
    parsed = JSON.parse(data)
    console.log("updated_user", data)
    get_user(parsed.original_record.uid)
  });
}

function logout() {
  eraseCookie('login')
  delete login_cookie
  delete login_value
  location.reload()
}

function next_uid() {
  for (var i in uid_list) {
    var uid = uid_list[i]
    if (uid < 6000) {
      return(uid+1)
    }
  }
}

function get_users(selected_user) {
  if (typeof(selected_user) == 'undefined') {
    selected_user = login_value.username
  }
  $('select#userlist').empty()
  user_list = []
  $.post(api_endpoint + 'users', login_value, function(data){
    var users_raw =  JSON.parse(data)
    for (var i=0, li=users_raw.length;i<li; i++) {
      for (var k in users_raw[i]) {
        if (users_raw[i].hasOwnProperty(k)) {
          var user = users_raw[i][k]
          if (user.hasOwnProperty('uid') && user.uid != 'template.user') {
            user_list.push(user.uid[0])
            uid_list.push(Number(user.uidNumber[0]))
            //console.log(user.uid[0])
          }
        }
      }
    }
    // console.log(login_value.username, )
    uid_list.sort(function(a,b){return b-a})
    user_list.sort()
    for (var i=0, li=user_list.length; i<li; i++) {
      var userselect = $('<option/>')
      userselect.text(user_list[i])
      if (user_list[i] == selected_user) {
        userselect.prop('selected', true)
      }
      userselect.appendTo($('select#userlist'))
    }
  });
}
function show_users() {
      if (login_result.access_level == 'admin') {
        $(".admin-only").show()
        get_users()
      }

}
function login() {
  var login_object
  if (typeof(login_value) === "undefined") {
    login_object = $('form#loginform').serializeObject()
  } else {
    login_object = login_value
  }
   
  $.post(api_endpoint + 'login', login_object, function(data){
    var login_result = JSON.parse(data)
    login_value = login_object
    createCookie('login', JSON.stringify(login_value), 0)
    get_user(login_value.username)
    $('#logoutdiv').show()
    if (login_result.access_level == 'admin') {
      $(".admin-only").show()
      get_users()
    }

  });

//      get_user(login_value.username, login_value.username, login_value.password)
}
$('form input[type="reset"]').click(function(){
  get_user(user_values.username)
  return false
});
/*
*/
function parse_form(form) {
 var form_object = $('form#' + form).serializeObject()
  for (var k in form_object) {
    if (original_user_data.hasOwnProperty(k)) {
      if (original_user_data[k].indexOf(form_object[k]) != -1) {
        // Unchanged value
        delete form_object[k]
      }
    } else {
      if (form_object[k].length == 0) {
        // Empty non existing value
        delete form_object[k]
      }
    }
  }
  if (Object.keys(form_object).length>0) {
    return form_object
  } else {
    return null
  }
}

$('form#loginform').submit(function(){
  login();
  return false;
});

$('button#logout').click(function(){
  logout();
  return false;
});

$('svg#adduser').click(function(){
  $('div#main').load("/html/adduserform.html", function() {
    $('form#addUserForm').submit(function(){
      add_user()
      return false;
    });

  });

});

$('select#userlist').change(function(){
  var edituser = $('select#userlist option:selected').text()
  get_user(edituser)
});

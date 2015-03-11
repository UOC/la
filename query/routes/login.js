module.exports = function (router, passport) {

    router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
      function(req, res) {
        res.redirect('/');
      });

    router.post('/signup', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    router.get('/error_not_authenticated',
        function (req, res) {
            res.render('error', { title: 'Error', message: 'User is not authenticated'});
        }
    );

    /**
     * LTI LOGIN
     * @param  {[type]} req  [description]
     * @param  {[type]} res) {                   res.render('profile.ejs' [description]
     * @param  {[type]} {                                                                user : req.user         }); [description]
     * @return {[type]}      [description]
     */
    router.post('/loginLTI',
        function (req, res) {
            var consumer_key_to_check = req.param('oauth_consumer_key');
            //var consumer_key_to_check = req.params["oauth_consumer_key"];
            var provider = null;
            var concat_consumer_key = true;
            var show_terms_conditions = false;
            var authInit = require('../config/auth'); // will hold all our client secret keys (lti) 

            for (var i = 0, len = authInit.imslti.length; i < len; i++) {
                var consumer_key = authInit.imslti[i].consumer_key;
                if (consumer_key_to_check === consumer_key) {
                    var imsLTI = require('ims-lti');
                    var consumer_secret = authInit.imslti[i].consumer_secret;
                    concat_consumer_key = authInit.imslti[i].concat_consumer_key;
                    show_terms_conditions = authInit.imslti[i].show_terms_conditions;
                    //console.log(consumer_key+" "+consumer_secret);
                    provider = new imsLTI.Provider(consumer_key, consumer_secret);
                    break;
                }
            }
            req.session.course = null;
            req.session.activity = null;
            req.session.userCourse = null;
            req.session.user = null;
            req.session.consumer_key = null;
            req.session.show_terms_conditions = show_terms_conditions;
            // access i18n
            var i18n = req.i18n;

            if (provider != null) {
                provider.valid_request(req, function (err, isValid) {
                    if (!isValid) {
                        res.render('error', { title: 'Error', message: 'Consumer key isValid ' + isValid + ' error ' + err, isValid: isValid });
                    } else {
                        var is_base64_encoded = req.body.custom_lti_message_encoded_base64 == 1;
                        var helper = require('../lib/helpers/helper.js');
                        var roles = helper.getLTIValue(provider, 'roles', is_base64_encoded);
                        if (roles instanceof Array) {
                            roles = roles[0];
                        }
                        if (is_base64_encoded) {
                            provider.body['roles'] = roles;
                            provider.body['custom_launch_container'] = provider.body.custom_launch_container?helper.getLTIValue(provider, 'custom_launch_container', is_base64_encoded):false;
                            provider.body['outcome_service'] = helper.getLTIValue(provider, 'outcome_service', is_base64_encoded);
                            provider.body['user_id'] = helper.getLTIValue(provider, 'user_id', is_base64_encoded);
                            if (provider.body.custom_username){
                                provider.body['custom_username'] = helper.getLTIValue(provider, 'custom_username', is_base64_encoded);
                            }
                            if (provider.body.custom_metadata_fields){
                                provider.body['custom_metadata_fields'] = helper.getLTIValue(provider, 'custom_metadata_fields', is_base64_encoded);
                            }
                            if (provider.body.custom_metadata_fields && provider.body.custom_metadata_fields>0){
                                for (var i=0; i<provider.body.custom_metadata_fields; i++ ) {
                                    if (eval('provider.body.custom_metadata_label_'+i)) {
                                        provider.body['custom_metadata_label_'+i] = helper.getLTIValue(provider, 'custom_metadata_label_'+i, is_base64_encoded);           
                                    }
                                    if (eval('provider.body.custom_metadata_value_'+i)) {
                                        provider.body['custom_metadata_value_'+i] = helper.getLTIValue(provider, 'custom_metadata_value_'+i, is_base64_encoded);           
                                    }
                                }
                            }
                            provider.body['lis_person_name_full'] = helper.getLTIValue(provider, 'lis_person_name_full', is_base64_encoded);
                            provider.body['lis_person_name_given'] = helper.getLTIValue(provider, 'lis_person_name_given', is_base64_encoded);
                            provider.body['lis_person_name_family'] = helper.getLTIValue(provider, 'lis_person_name_family', is_base64_encoded);
                            provider.body['lis_person_contact_email_primary'] = helper.getLTIValue(provider, 'lis_person_contact_email_primary', is_base64_encoded);
                            provider.body['context_id'] = helper.getLTIValue(provider, 'context_id', is_base64_encoded);
                            provider.body['context_label'] = helper.getLTIValue(provider, 'context_label', is_base64_encoded);
                            provider.body['context_title'] = helper.getLTIValue(provider, 'context_title', is_base64_encoded);
                            provider.body['resource_link_id'] = helper.getLTIValue(provider, 'resource_link_id', is_base64_encoded);
                            provider.body['resource_link_description'] = helper.getLTIValue(provider, 'resource_link_description', is_base64_encoded);
                            provider.body['resource_link_title'] = helper.getLTIValue(provider, 'resource_link_title', is_base64_encoded);
                            provider.body['launch_presentation_locale'] = helper.getLTIValue(provider, 'launch_presentation_locale', is_base64_encoded);
                            provider.parse_request(provider);
                        }
                        var outcome_service = provider.outcome_service;
                        var email = (provider.body.lis_person_contact_email_primary) || '';
                        var fullname = (provider.body.lis_person_name_full) || (provider.body.lis_person_name_given + (provider.body.lis_person_name_given!=provider.body.lis_person_name_family? ' ' + provider.body.lis_person_name_family:'') )|| '';
                        var user_id = provider.consumer_key + "_" + provider.userId;
                        if (provider.body.custom_username){
                            user_id = provider.body.custom_username;
                        }
                        //Allow metadata sent via consumer key
                        var params_metadata = [];
                        var CustomMeta = function (field, value) {this.field = field; this.value = value};
                        if (provider.body.custom_metadata_fields && provider.body.custom_metadata_fields>0){
                            for (var i=0; i<provider.body.custom_metadata_fields; i++ ) {
                                if (eval('provider.body.custom_metadata_label_'+i) && eval('provider.body.custom_metadata_value_'+i)) {
                                    params_metadata.push(new CustomMeta(eval('provider.body.custom_metadata_label_'+i), eval('provider.body.custom_metadata_value_'+i)));
                                }
                            }
                        }

                        var context_id = provider.context_id;
                        var course_key = concat_consumer_key?provider.consumer_key + "_" + context_id:context_id;
                        var context_label = provider.context_label;
                        var context_title = provider.context_title ? provider.context_title : context_label;
                        var resource_link_id = provider.body.resource_link_id;
                        var resource_link_key = concat_consumer_key?course_key + "_" + resource_link_id:resource_link_id;
                        var resource_link_description = provider.body.resource_link_description;
                        var resource_link_title = provider.body.resource_link_title;
                        var launch_presentation_locale = provider.body.launch_presentation_locale;

                        //1st create user or update it
                        var User = require('../lib/entities/user');
                        User.findOne({'userkey': user_id}, function (err, user) {
                            if (err) {
                                var error_message = "Error find user";
                                console.error(error_message);
                                res.render('error', { title: 'Error', message: error_message, isValid: false });
                            } else {
                                if (user == null) {
                                    user = new User();
                                    user.created = new Date();
                                    user.setPassword(Math.random() + email + new Date());
                                    user.userkey = user_id;
                                }
                                user.fullname = fullname;
                                user.email = email;
                                user.last_access = new Date();
                                user.save(function (err) {
                                    if (err) {
                                        var error_message = "Error saving user " + err;
                                        console.error(error_message);
                                        res.render('error', { title: 'Error', message: error_message, isValid: false });
                                    }
                                    else {
                                        //2nd create course or update it
                                        var Course = require('../lib/entities/course');
                                        Course.coursekey = course_key;  // set the coursekey
                                        Course.findOne({'coursekey': course_key}, function (err, course) {
                                            if (err) {
                                                var error_message = "Error find course";
                                                console.error(error_message);
                                                res.render('error', { title: 'Error', message: error_message, isValid: false });
                                            } else {

                                                if (course == null) {
                                                    course = new Course();
                                                    course.created = new Date();
                                                    course.coursekey = course_key;
                                                }
                                                course.coursename = context_title || context_label;
                                                course.courselang = launch_presentation_locale;
                                                var lang = 'es';
                                                if (course.courselang == 'ca-ES' || course.courselang == 'ca') {
                                                    lang = 'ca';
                                                } else {
                                                    if (course.courselang == 'es-ES' || course.courselang == 'es') {
                                                        lang = 'es';
                                                    }
                                                    else {
                                                        if (course.courselang == 'en-US' || course.courselang == 'en-GB' || course.courselang == 'en') {
                                                            lang = 'en';
                                                        } else {
                                                            if (course.courselang == 'fr-FR' || course.courselang == 'fr') {
                                                                lang = 'fr';
                                                            } 
                                                        }
                                                    }
                                                }
                                                course.last_modified = new Date();
                                                course.save(function (err) {

                                                    if (err) {
                                                        var error_message = "Error saving course " + err;
                                                        console.error(error_message);
                                                        res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                    }
                                                    else {
                                                        //3rd create course or update it
                                                        var Activity = require('../lib/entities/activity');
                                                        Activity.findOne({'course': course, 'resourcekey': resource_link_key}, function (err, activity) {
                                                            if (err) {
                                                                var error_message = "Error find activity";
                                                                console.error(error_message);
                                                                res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                            } else {
                                                                if (activity == null) {
                                                                    activity = new Activity();
                                                                    activity.created = new Date();
                                                                    activity.course = course;  // set the course
                                                                    activity.resourcekey = resource_link_key;  // set the resourcekey
                                                                }
                                                                activity.resourcename = resource_link_title || resource_link_key;
                                                                activity.last_modified = new Date();
                                                                activity.save(function (err) {
                                                                    if (err) {
                                                                        var error_message = "Error saving activity " + err;
                                                                        console.error(error_message);
                                                                        res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                                    }
                                                                });
                                                                //4th add user to course
                                                                var UserCourse = require('../lib/entities/userCourse');
                                                                UserCourse.findOne({'course': course, 'user': user}, function (err, userCourse) {
                                                                    if (err) {
                                                                        var error_message = "Error find usercourse";
                                                                        console.error(error_message);
                                                                        res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                                    } else {
                                                                        if (userCourse == null) {
                                                                            userCourse = new UserCourse();
                                                                            userCourse.created = new Date();
                                                                            userCourse.course = course;  // set the course
                                                                            userCourse.user = user;  // set the user
                                                                        }
                                                                        userCourse.roles = roles;
                                                                        userCourse.is_student = provider.student;
                                                                        userCourse.is_instructor = provider.instructor;
                                                                        userCourse.is_admin = provider.admin;
                                                                        userCourse.last_modified = new Date();
                                                                        userCourse.save(function (err) {
                                                                            if (err) {
                                                                                var error_message = "Error saving userCourse " + err;
                                                                                console.error(error_message);
                                                                                res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                                            }
                                                                        });
                                                                        //console.log("saved userCourse");
                                                                        //5th login user in passport
                                                                        req.login(user, function (err) {
                                                                            //req.login(user, function(err) {
                                                                            if (err) {
                                                                                var error_message = 'Error in LTI authentication ' + err;
                                                                                console.error(error_message);
                                                                                res.render('error', { title: 'Error', message: error_message, isValid: false });
                                                                            }
                                                                            else {
                                                                                req.session.params_metadata = params_metadata;
                                                                                req.session.consumer_key = provider.consumer_key;
                                                                                req.session.course = course;
                                                                                req.session.activity_id = activity.id;
                                                                                req.session.activity_key = activity.resourcekey;
                                                                                req.session.user = user;
                                                                                req.session.userCourse = userCourse;
                                                                                req.session.is_new_window = provider.body['custom_launch_container']=='new_window';
                                                                                req.session.save(function (err) {
                                                                                    // session saved
                                                                                });
                                                                                res.redirect('/dashboard?setLng=' + lang);
                                                                            }

                                                                        });
                                                                        //  });

                                                                    }
                                                                });

                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                console.warn('Consumer key ' + consumer_key_to_check + ' is not enabled');

                res.render('error', { title: 'Error', message: 'Consumer key is not enabled', isValid: false });
            }
        });
};

import csv
import uuid
import datetime
import json
import sys

from pymongo import Connection
from tincan import (
    RemoteLRS,
    Statement,
    Agent,
    AgentAccount,
    Verb,
    Activity,
    Context,
    LanguageMap,
    ActivityDefinition,
    StateDocument,
    Extensions,
    Result
)

"""
"""
def create_AEP_statement(row):

	cod_element, estat_solicitud, any_acad_valida, desc_estat, any_academico, idp, num_expedient, asigna_clase, estat, num_creditos, cod_plan = row
	statement = Statement({
	    'actor': Agent({
	    	'account': AgentAccount({
	    		'name': idp,
	    	}),
	    }),
	    'verb': Verb({
		    'id': 'http://la.uoc.edu/verb/aeprequest',
		    'display': LanguageMap({'en-US': 'AEP Request'}),
		}),
	    'object': Activity({
	    	'id': 'http://la.uoc.edu/object/subject/code/%s' % cod_element,
			'definition': ActivityDefinition({
				'extensions': Extensions({
					'edu:uoc:la:subject': {
						'code': cod_element,
						'credits': num_creditos,
					},
					'edu:uoc:la:plan': {
						'code': cod_plan,
					},
					'edu:uoc:la:semester': {
						'code': any_academico,
						'validated': any_acad_valida,
					},
					'edu:uoc:la:expedient': {
						'code': num_expedient,
					},
					'edu:uoc:la:aep': {
						'status': estat,
						'classification': asigna_clase
					}
				})
			})
	    }),
	    'result': Result({
	    	'success': estat == 'A',
	    }),
	    'timestamp': datetime.datetime.utcnow(),
		'context': Context({
		    'registration': uuid.uuid4(),
		})
	})
	return json.loads(statement.to_json())

"""
"""
def create_Matricula_statement(row):

	division, num_expediente, any_academico, inv_estado_expediente, idp, anula_matricula, motiu_anulacio, cod_plan, desc_plan, cod_estudios, desc_estudios, tipo_educacion, oficial_propi, cod_area, desc_area = row
	statement = Statement({
	    'actor': Agent({
	    	'account': AgentAccount({
	    		'name': idp,
	    	}),
	    }),
	    'verb': Verb({
		    'id': 'http://la.uoc.edu/verb/enrolment',
		    'display': LanguageMap({'en-US': 'Enrolment'}),
		}),
	    'object': Activity({
	    	'id': 'http://la.uoc.edu/object/expedient/code/%s' % num_expediente,
			'definition': ActivityDefinition({
				'extensions': Extensions({
					'edu:uoc:la:expedient': {
						'code': num_expediente,
						'division': division,
						'status': inv_estado_expediente,
					},
					'edu:uoc:la:semester': {
						'code': any_academico,
					},
					'edu:uoc:la:plan': {
						'code': cod_plan,
						'description': desc_plan,
					},
					'edu:uoc:la:study': {
						'code': cod_estudios,
						'description': desc_estudios,
						'type': tipo_educacion,
						'official': oficial_propi,
					},
					'edu:uoc:la:area': {
						'code': cod_area,
						'description': desc_area,
					},
					'edu:uoc:la:enrolment': {
						'cancelation': {
							'date': anula_matricula,
							'reason': motiu_anulacio,
						},
					}
				})
			})
	    }),
	    'result': Result({
	    	'success': not anula_matricula,
	    }),
	    'timestamp': datetime.datetime.utcnow(),
		'context': Context({
		    'registration': uuid.uuid4(),
		})
	})
	return json.loads(statement.to_json())

"""
"""
def create_ass_matr_statement(row):

	cod_asignatura, any_academic, userid, idp = row
	statement = Statement({
	    'actor': Agent({
	    	'account': AgentAccount({
	    		'name': idp,
	    	}),
	    }),
	    'verb': Verb({
		    'id': 'http://la.uoc.edu/verb/subject/enrolment',
		    'display': LanguageMap({'en-US': 'Enrolment'}),
		}),
	    'object': Activity({
	    	'id': 'http://la.uoc.edu/object/subject/code/%s' % cod_asignatura,
			'definition': ActivityDefinition({
				'extensions': Extensions({
					'edu:uoc:la:subject': {
						'code': cod_asignatura
					},
					'edu:uoc:la:semester': {
						'code': any_academic,
					}
				})
			})
	    }),
	    'result': Result({
	    }),
	    'timestamp': datetime.datetime.utcnow(),
		'context': Context({
		    'registration': uuid.uuid4(),
		})
	})
	return json.loads(statement.to_json())

"""
"""
def create_Performance_statement(row):

	division, num_expediente, idp, cod_asignatura, desc_assignatura, af, nf, supera_s_n, seguiment_ac_s_n, tipus_examen, qe, qualificacio_teorica, nota_prova_validacio, cod_estudios, desc_estudios, codi_aula, any_academic = row
	statement = Statement({
	    'actor': Agent({
	    	'account': AgentAccount({
	    		'name': idp,
	    	}),
	    }),
	    'verb': Verb({
		    'id': 'http://la.uoc.edu/verb/performance',
		    'display': LanguageMap({'en-US': 'Enrolment'}),
		}),
	    'object': Activity({
	    	'id': 'http://la.uoc.edu/object/expedient/code/%s' % num_expediente,
			'definition': ActivityDefinition({
				'extensions': Extensions({
					'edu:uoc:la:expedient': {
						'code': num_expediente,
						'division': division,
					},
					'edu:uoc:la:subject': {
						'code': cod_asignatura,
						'description': desc_assignatura,
						'evaluation': {
							'af': af,
							'nf': nf,
							'ac': {
								'follows': seguiment_ac_s_n == 'Si',
								'pass': supera_s_n == 'Si',
							},
							'examType': tipus_examen,
							'qe': qe,
							'qt': qualificacio_teorica,
							'validationTest': {
								'qualification': nota_prova_validacio
							}
						}
					},
					'edu:uoc:la:semester': {
						'code': any_academic,
					},
					'edu:uoc:la:study': {
						'code': cod_estudios,
						'description': desc_estudios,
					},
					'edu:uoc:la:classroom': {
						'code': codi_aula,
					},
				})
			})
	    }),
	    'result': Result({
	    }),
	    'timestamp': datetime.datetime.utcnow(),
		'context': Context({
		    'registration': uuid.uuid4(),
		})
	})
	return json.loads(statement.to_json())

"""
"""
def create_login_logout_statement(row):

    print(row)
    if len(row) == 5:
        userid, login, logout, ip, lastaction = row
    else:
        return json.loads("{}")

    try:
        logintime = datetime.datetime.strptime(login, "%d%m%Y%H%M%S").isoformat()
        logouttime = datetime.datetime.strptime(logout, "%d%m%Y%H%M%S").isoformat()
        lastactiontime = datetime.datetime.strptime(lastaction, "%d%m%Y%H%M%S").isoformat()
    except ValueError:
        logintime = ''
        logouttime = ''
        lastactiontime = ''

    statement = Statement({
	    'actor': Agent({
	    	'account': AgentAccount({
	    		'name': userid,
	    	}),
	    }),
	    'verb': Verb({
		    'id': 'http://la.uoc.edu/verb/login',
		    'display': LanguageMap({'en-US': 'Login'}),
		}),
	    'object': Activity({
	    	'id': 'http://la.uoc.edu/object/login',
			'definition': ActivityDefinition({
				'extensions': Extensions({
					'edu:uoc:la:campus': {
                      'userid': userid,
					},
					'edu:uoc:la:login': {
                      'login':  logintime,
                      'logout':  logouttime,
                      'lastactiontime':  lastactiontime,
                    },
				})
			})
	    }),
	    'result': Result({
	    }),
	    'timestamp': datetime.datetime.utcnow(),
		'context': Context({
		    'registration': uuid.uuid4(),
		})
	})
    return json.loads(statement.to_json())

"""
"""
def import_aep(collection):
	with open('data/Dataset_Graus_2008-09_20141_Assig_Conv_Adap_AEP.csv', 'rb') as csvfile:
		reader = csv.reader(csvfile, delimiter=';', quotechar='"')
		next(reader, None)
		collection.insert([create_AEP_statement(row) for row in reader])

"""
"""
def import_enrolment(collection):
	with open('data/Dataset_Graus_2008-09_20141_Matricula.csv', 'rb') as csvfile:
		reader = csv.reader(csvfile, delimiter=';', quotechar='"')
		next(reader, None)
		collection.insert([create_Matricula_statement(row) for row in reader])

"""
"""
def import_performance(collection):
	with open('data/Dataset_Graus_2008-09_20141_Rendiment_Assignatures.csv', 'rb') as csvfile:
		reader = csv.reader(csvfile, delimiter=';', quotechar='"')
		next(reader, None)
		collection.insert([create_Performance_statement(row) for row in reader])

"""
"""
def import_assmatr(collection):
    with open('data/matricula_per_usuaris_i_aules.csv', 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=';', quotechar='"')
        next(reader, None)
        collection.insert([create_ass_matr_statement(row) for row in reader])
"""
"""
def import_login_logout(collection):
    with open('data/loginhistory.csv', 'rU') as csvfile:
        reader = csv.reader(csvfile, delimiter=';', quotechar='"')
        next(reader, None)
        for row in reader:
            collection.insert(create_login_logout_statement(row))

"""
"""
csv.field_size_limit(sys.maxsize)

connection = Connection('localhost', 27017)
db = connection.lrs
collection = db.statements
#import_aep(collection)
#import_enrolment(collection)
#import_performance(collection)
#import_assmatr(collection)
import_login_logout(collection)

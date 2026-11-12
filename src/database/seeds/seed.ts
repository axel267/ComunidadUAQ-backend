import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { fakerES as faker } from '@faker-js/faker';
import { AppModule } from '../../app.module';
import { Facultade } from '../../facultades/entities/facultade.entity';
import { Role } from '../../sessions/role.entity';
import { User } from '../../sessions/user.entity';
import { Aviso, NivelUrgencia, EstadoModeracion } from '../../avisos/entities/aviso.entity';
import { LecturaAviso } from '../../avisos/entities/lectura-aviso.entity';
import { ForoPublicacion } from '../../foros/entities/foro-publicacion.entity';
import { ForoComentario } from '../../foros/entities/foro-comentario.entity';
import { GuiaTramite } from '../../guias-tramites/entities/guia-tramite.entity';
import { PasoGuia } from '../../guias-tramites/entities/paso-guia.entity';
import { RoleId, RoleName } from '../../auth/constants/roles.enum';

const PASSWORD_POR_DEFECTO = 'Uaq2026!';

async function runSeed() {
  console.log('========================================');
  console.log('   INICIANDO SEEDER CON FAKER - FIF UAQ   ');
  console.log('========================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const facultadesRepo: Repository<Facultade> = app.get(getRepositoryToken(Facultade));
    const rolesRepo: Repository<Role> = app.get(getRepositoryToken(Role));
    const usersRepo: Repository<User> = app.get(getRepositoryToken(User));
    const avisosRepo: Repository<Aviso> = app.get(getRepositoryToken(Aviso));
    const lecturasRepo: Repository<LecturaAviso> = app.get(getRepositoryToken(LecturaAviso));
    const forosRepo: Repository<ForoPublicacion> = app.get(getRepositoryToken(ForoPublicacion));
    const comentariosRepo: Repository<ForoComentario> = app.get(getRepositoryToken(ForoComentario));
    const guiasRepo: Repository<GuiaTramite> = app.get(getRepositoryToken(GuiaTramite));

    // ─────────────────────────────────────────────────────────────
    // 1. ROLES INSTITUCIONALES
    // ─────────────────────────────────────────────────────────────
    console.log('[1/7] Configurando Roles Institucionales...');
    const rolesData = [
      { id: RoleId.ADMIN, nombre: RoleName.ADMIN, permisos: { all: true } },
      { id: RoleId.ESTUDIANTE, nombre: RoleName.ESTUDIANTE, permisos: { read_avisos: true, post_foro: true } },
      { id: RoleId.DOCENTE, nombre: RoleName.DOCENTE, permisos: { manage_avisos_area: true, manage_guias_area: true } },
      { id: RoleId.COORDINADOR, nombre: RoleName.COORDINADOR, permisos: { manage_avisos_area: true, manage_guias_area: true, view_history: true } },
    ];

    for (const r of rolesData) {
      let rol = await rolesRepo.findOneBy({ id: r.id });
      if (!rol) {
        rol = rolesRepo.create(r);
        await rolesRepo.save(rol);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. FACULTADES (Catálogo UAQ + Generadas con Faker)
    // ─────────────────────────────────────────────────────────────
    console.log('[2/7] Generando Facultades con Faker y Catálogo Institucional...');
    const facultadesCatalogo = [
      { id: 1, nombre: 'Facultad de Informática', abreviatura: 'FIF' },
      { id: 2, nombre: 'Facultad de Ingeniería', abreviatura: 'FI' },
      { id: 3, nombre: 'Facultad de Ciencias Naturales', abreviatura: 'FCN' },
      { id: 4, nombre: 'Facultad de Contaduría y Administración', abreviatura: 'FCA' },
      { id: 5, nombre: 'Facultad de Medicina', abreviatura: 'FM' },
      { id: 6, nombre: 'Facultad de Química', abreviatura: 'FQ' },
      { id: 7, nombre: 'Facultad de Derecho', abreviatura: 'FD' },
      { id: 8, nombre: 'Facultad de Bellas Artes', abreviatura: 'FBA' },
      { id: 9, nombre: 'Facultad de Psicología y Educación', abreviatura: 'FPE' },
      { id: 10, nombre: 'Facultad de Lenguas y Letras', abreviatura: 'FLL' },
      { id: 11, nombre: 'Facultad de Ciencias Políticas y Sociales', abreviatura: 'FCPS' },
      { id: 12, nombre: 'Facultad de Filosofía', abreviatura: 'FFI' },
    ];

    // Generar facultades adicionales aleatorias con Faker
    const disciplinasEmergentes = [
      'Biotecnología y Genómica',
      'Ciberseguridad y Redes Cuánticas',
      'Diseño y Arquitectura Sustentable',
      'Aeronáutica y Exploración Espacial',
      'Inteligencia Artificial y Robótica',
      'Nanotecnología y Materiales Avanzados',
    ];

    for (let idx = 0; idx < disciplinasEmergentes.length; idx++) {
      const disciplina = disciplinasEmergentes[idx];
      const palabras = disciplina.split(' ').filter((w) => w.length > 2);
      const abreviatura = ('F' + palabras.map((p) => p[0].toUpperCase()).join('')).slice(0, 5);
      facultadesCatalogo.push({
        id: 13 + idx,
        nombre: `Facultad de ${disciplina}`,
        abreviatura,
      });
    }

    const facultadesGuardadas: Facultade[] = [];
    for (const f of facultadesCatalogo) {
      let fac = await facultadesRepo.findOne({
        where: [{ id: f.id }, { nombre: f.nombre }],
      });
      if (!fac) {
        fac = facultadesRepo.create(f);
        await facultadesRepo.save(fac);
      }
      facultadesGuardadas.push(fac);
    }
    const fif = facultadesGuardadas[0];
    const fi = facultadesGuardadas[1];

    // ─────────────────────────────────────────────────────────────
    // 3. USUARIOS (Fijos para Login y pruebas + Generados con Faker)
    // ─────────────────────────────────────────────────────────────
    console.log('[3/7] Generando Usuarios con Faker (Estudiantes, Docentes, Coordinación y Admin)...');
    const defaultPasswordHash = await bcrypt.hash(PASSWORD_POR_DEFECTO, 10);

    const usuariosFijos = [
      {
        expediente: 10001,
        nombre: 'Ing. Carlos Mendoza (Admin)',
        email: 'admin@uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.ADMIN,
        area: 'Dirección de Tecnologías UAQ',
        carrera: 'Ingeniería de Software',
        facultades: [fif, fi],
        estadoActivo: true,
      },
      {
        expediente: 10002,
        nombre: 'Mtra. Elena Salgado (Coordinación FIF)',
        email: 'coordinador.fif@uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.COORDINADOR,
        area: 'Coordinación Académica FIF',
        carrera: 'Licenciatura en Informática',
        facultades: [fif],
        estadoActivo: true,
      },
      {
        expediente: 10003,
        nombre: 'Dr. Roberto Navarro (Docente FIF)',
        email: 'docente.fif@uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.DOCENTE,
        area: 'Inteligencia Artificial y Sistemas',
        carrera: 'Ingeniería de Software',
        facultades: [fif],
        estadoActivo: true,
      },
      {
        expediente: 10004,
        nombre: 'Dra. Patricia Ortiz (Docente FI)',
        email: 'docente.fi@uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.DOCENTE,
        area: 'Mecatrónica y Automatización',
        carrera: 'Ingeniería Mecánica',
        facultades: [fi],
        estadoActivo: true,
      },
      {
        expediente: 290001,
        nombre: 'Alan Xotla (Estudiante FIF)',
        email: 'alumno1@alumnos.uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.ESTUDIANTE,
        carrera: 'Ingeniería de Software',
        facultades: [fif],
        estadoActivo: true,
      },
      {
        expediente: 290002,
        nombre: 'Mariana Gómez (Estudiante FIF)',
        email: 'alumno2@alumnos.uaq.mx',
        pass: defaultPasswordHash,
        rolId: RoleId.ESTUDIANTE,
        carrera: 'Licenciatura en Informática',
        facultades: [fif],
        estadoActivo: true,
      },
    ];

    const todosLosUsuarios: User[] = [];

    // Guardar usuarios fijos
    for (const u of usuariosFijos) {
      let user = await usersRepo.findOne({ where: { email: u.email } });
      if (!user) {
        user = usersRepo.create(u);
        await usersRepo.save(user);
      }
      todosLosUsuarios.push(user);
    }

    // Catálogo de Carreras y Áreas por Facultad
    const catalogoCarreras: Record<string, string[]> = {
      FIF: [
        'Ingeniería de Software',
        'Licenciatura en Informática',
        'Ingeniería en Computación',
        'Ingeniería en Telecomunicaciones y Redes',
        'Licenciatura en Administración de Tecnologías de Información',
        'Ingeniería en Ciberseguridad',
      ],
      FI: [
        'Ingeniería Civil',
        'Ingeniería Mecánica y Automotriz',
        'Ingeniería Electromecánica',
        'Ingeniería en Automatización',
        'Ingeniería Industrial',
      ],
      FCN: [
        'Licenciatura en Biología',
        'Licenciatura en Microbiología',
        'Médico Veterinario Zootecnista',
        'Licenciatura en Nutrición',
      ],
      FCA: [
        'Licenciatura en Contaduría Pública',
        'Licenciatura en Administración',
        'Licenciatura en Negocios Internacionales',
      ],
      FM: ['Médico General', 'Licenciatura en Odontología', 'Licenciatura en Fisioterapia'],
      FQ: ['Química Farmacéutica Biológica', 'Ingeniería Química Ambiental', 'Ingeniería en Biotecnología'],
      FD: ['Licenciatura en Derecho', 'Licenciatura en Criminología', 'Licenciatura en Ciencias Forenses'],
    };

    const catalogoAreas = [
      'Inteligencia Artificial y Ciencia de Datos',
      'Ciberseguridad y Redes Avanzadas',
      'Desarrollo Web, Móvil y Cloud',
      'Sistemas Embebidos e Internet de las Cosas',
      'Automatización y Robótica Industrial',
      'Energías Renovables y Sustentabilidad',
      'Biotecnología Molecular y Salud',
      'Gestión Financiera e Innovación de Negocios',
      'Derecho Constitucional y Derechos Humanos',
    ];

    // 3.1. Generar Coordinadores adicionales con Faker para otras facultades
    console.log('   Generando 3 Coordinadores adicionales con Faker...');
    const otrasFacultades = facultadesGuardadas.filter((f) => f.abreviatura !== 'FIF');
    for (let i = 0; i < 3; i++) {
      const fac = otrasFacultades[i % otrasFacultades.length];
      const prefijo = faker.helpers.arrayElement(['Mtro.', 'Mtra.', 'Dr.', 'Dra.']);
      const nombreCompleto = `${prefijo} ${faker.person.fullName()} (Coord. ${fac.abreviatura})`;
      const firstName = faker.person.firstName().toLowerCase().replace(/[^a-z]/g, '');
      const lastName = faker.person.lastName().toLowerCase().replace(/[^a-z]/g, '');
      const email = `coordinador.${fac.abreviatura.toLowerCase()}@uaq.mx`;
      const expediente = 10010 + i;

      let coord = await usersRepo.findOne({ where: { email } });
      if (!coord) {
        coord = usersRepo.create({
          expediente,
          nombre: nombreCompleto,
          email,
          pass: defaultPasswordHash,
          rolId: RoleId.COORDINADOR,
          area: `Coordinación Académica ${fac.abreviatura}`,
          carrera: catalogoCarreras[fac.abreviatura]?.[0] || 'Gestión Académica',
          facultades: [fac],
          estadoActivo: true,
        });
        await usersRepo.save(coord);
      }
      todosLosUsuarios.push(coord);
    }

    // 3.2. Generar 12 Docentes adicionales con Faker
    console.log('   Generando 12 Docentes con Faker...');
    for (let i = 1; i <= 12; i++) {
      const prefijo = faker.helpers.arrayElement(['Dr.', 'Dra.', 'Mtro.', 'Mtra.', 'Ing.']);
      const nombreCompleto = `${prefijo} ${faker.person.fullName()}`;
      const firstName = faker.person.firstName().toLowerCase().replace(/[^a-z]/g, '');
      const lastName = faker.person.lastName().toLowerCase().replace(/[^a-z]/g, '');
      const email = `${firstName}.${lastName}${i}@uaq.mx`;
      const expediente = 15000 + i;

      const facAsignada = faker.helpers.arrayElement(facultadesGuardadas);
      const carrerasFac = catalogoCarreras[facAsignada.abreviatura] || catalogoCarreras['FIF'];

      let doc = await usersRepo.findOne({ where: { expediente } });
      if (!doc) {
        doc = usersRepo.create({
          expediente,
          nombre: nombreCompleto,
          email,
          pass: defaultPasswordHash,
          rolId: RoleId.DOCENTE,
          area: faker.helpers.arrayElement(catalogoAreas),
          carrera: faker.helpers.arrayElement(carrerasFac),
          facultades: [facAsignada],
          estadoActivo: true,
        });
        await usersRepo.save(doc);
      }
      todosLosUsuarios.push(doc);
    }

    // 3.3. Generar 35 Estudiantes adicionales con Faker distribuidos en facultades
    console.log('   Generando 35 Estudiantes con Faker...');
    for (let i = 10; i < 45; i++) {
      const nombreCompleto = faker.person.fullName();
      const firstName = faker.person.firstName().toLowerCase().replace(/[^a-z]/g, '');
      const lastName = faker.person.lastName().toLowerCase().replace(/[^a-z]/g, '');
      const email = `${firstName}.${lastName}${i}@alumnos.uaq.mx`;
      const expediente = 290000 + i;

      const facAsignada = faker.helpers.arrayElement(facultadesGuardadas);
      const carrerasFac = catalogoCarreras[facAsignada.abreviatura] || catalogoCarreras['FIF'];

      let student = await usersRepo.findOne({ where: { expediente } });
      if (!student) {
        student = usersRepo.create({
          expediente,
          nombre: nombreCompleto,
          email,
          pass: defaultPasswordHash,
          rolId: RoleId.ESTUDIANTE,
          carrera: faker.helpers.arrayElement(carrerasFac),
          facultades: [facAsignada],
          estadoActivo: true,
        });
        await usersRepo.save(student);
      }
      todosLosUsuarios.push(student);
    }

    const estudiantes = todosLosUsuarios.filter((u) => u.rolId === RoleId.ESTUDIANTE);
    const docentes = todosLosUsuarios.filter((u) => u.rolId === RoleId.DOCENTE);
    const coordinadores = todosLosUsuarios.filter((u) => u.rolId === RoleId.COORDINADOR);
    const admin = todosLosUsuarios.find((u) => u.rolId === RoleId.ADMIN)!;
    const coordinador = coordinadores[0];

    // ─────────────────────────────────────────────────────────────
    // 4. AVISOS INSTITUCIONALES (Base y Generados con Faker)
    // ─────────────────────────────────────────────────────────────
    console.log('[4/7] Generando Avisos Institucionales con Faker...');
    const avisosCatalogo = [
      {
        titulo: 'Suspension urgente de clases presenciales por contingencia climatica',
        contenido:
          'Por indicaciones de Protección Civil Universitaria y debido a las fuertes lluvias registradas en la zona metropolitana de Querétaro, se suspenden todas las actividades presenciales en el Campus Juriquilla y Centro Universitario a partir de las 14:00 hrs. Las clases continuarán de manera virtual mediante Microsoft Teams.',
        urgencia: NivelUrgencia.URGENTE,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: admin.id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800',
      },
      {
        titulo: 'Convocatoria de Becas de Excelencia y Transporte UAQ 2026-2',
        contenido:
          'La Secretaría de Atención a la Comunidad Universitaria abre la convocatoria para las Becas Institucionales del semestre 2026-2. Los interesados deberán contar con un promedio mínimo de 8.5 en el semestre anterior y no adeudar materias. Consulta las bases completas en la ventanilla virtual.',
        urgencia: NivelUrgencia.ALTA,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: coordinador.id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
      },
      {
        titulo: 'Hackathon Anual FIF 2026: Retos de IA e Innovacion Civica',
        contenido:
          'Invitamos a todos los estudiantes de la Facultad de Informática a participar en la edición 2026 del Hackathon FIF. 36 horas continuas de desarrollo, mentorías especializadas con empresas de Silicon Valley y Querétaro, y más de $50,000 MXN en premios para los mejores proyectos.',
        urgencia: NivelUrgencia.MEDIA,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: docentes[0].id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      },
      {
        titulo: 'Periodo de reinscripcion y validacion de carga academica 2026-2',
        contenido:
          'Se les recuerda a los estudiantes de 2° a 9° semestre que el sistema de selección de horarios en el portal académico estará disponible a partir del lunes 18 a las 09:00 hrs conforme a su promedio general. Recuerda verificar no tener adeudos en biblioteca.',
        urgencia: NivelUrgencia.ALTA,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: coordinador.id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      },
      {
        titulo: 'Nuevos horarios de cafeteria y areas de estudio en la FIF',
        contenido:
          'A partir de esta semana, las salas de estudio colaborativo del edificio C permanecerán abiertas hasta las 21:30 hrs para apoyar a los estudiantes durante el periodo de exámenes parciales.',
        urgencia: NivelUrgencia.BAJA,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: docentes[1].id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800',
      },
      {
        titulo: 'Torneo de Programacion Competitiva ACM-ICPC Sede Queretaro',
        contenido:
          'La Universidad Autónoma de Querétaro será sede de la eliminatoria regional del concurso internacional de programación ICPC. Forma tu equipo de 3 personas y asiste al taller de preparación en el laboratorio L1.',
        urgencia: NivelUrgencia.MEDIA,
        estadoPublicacion: EstadoModeracion.APROBADA,
        facultadId: fif.id,
        autorId: docentes[0].id,
        imagenesPortadaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      },
    ];

    // Generar 16 Avisos adicionales dinámicos con Faker
    console.log('   Generando 16 Avisos adicionales con Faker...');
    const temasAvisosFaker = [
      {
        tipo: 'Convocatoria Oficial',
        tema: 'Programa de Movilidad e Intercambio Académico 2026-2027',
        cuerpo: 'Se invita a estudiantes con más del 50% de créditos aprobados a postularse a estancias internacionales en universidades de Europa, Norteamérica y Latinoamérica.',
        urgencia: NivelUrgencia.ALTA,
      },
      {
        tipo: 'Taller Especializado',
        tema: 'Certificación en Ciberseguridad Ofensiva y Análisis Forense',
        cuerpo: 'Capacitación teórico-práctica con validez oficial impartida por ingenieros certificados. Se abordarán temas de escaneo de vulnerabilidades, exploits y hardening de servidores.',
        urgencia: NivelUrgencia.MEDIA,
      },
      {
        tipo: 'Aviso Urgente',
        tema: 'Simulacro General de Evacuación por Protección Civil Universitaria',
        cuerpo: 'El próximo miércoles a las 11:00 hrs se llevará a cabo el simulacro institucional con hipótesis de sismo. Es de carácter obligatorio desalojar aulas y laboratorios hacia los puntos de reunión.',
        urgencia: NivelUrgencia.URGENTE,
      },
      {
        tipo: 'Convocatoria Oficial',
        tema: 'Fondo de Apoyo a Proyectos de Titulación e Investigación Temprana',
        cuerpo: 'La Secretaría de Investigación otorga apoyos económicos de hasta $25,000 MXN para consumibles y equipo a estudiantes en proceso de desarrollo de tesis.',
        urgencia: NivelUrgencia.MEDIA,
      },
      {
        tipo: 'Aviso de Coordinación',
        tema: 'Fechas límite para baja de materias y ajustes de carga académica',
        cuerpo: 'Se notifica a los estudiantes que el último día para solicitar bajas extemporáneas autorizadas por consejo académico es el próximo viernes a las 15:00 hrs.',
        urgencia: NivelUrgencia.ALTA,
      },
      {
        tipo: 'Taller Especializado',
        tema: 'Desarrollo de Microservicios con NestJS, Docker y TypeScript',
        cuerpo: 'Taller intensivo sabatino enfocado en buenas prácticas de arquitectura modular, bases de datos PostgreSQL y despliegue automatizado con contenedores.',
        urgencia: NivelUrgencia.BAJA,
      },
      {
        tipo: 'Aviso Urgente',
        tema: 'Mantenimiento preventivo mayor y corte temporal de energía en Campus',
        cuerpo: 'Se informa que el suministro eléctrico será interrumpido el domingo de 08:00 a 14:00 hrs por trabajos de mantenimiento en la subestación principal. Tome previsiones.',
        urgencia: NivelUrgencia.URGENTE,
      },
      {
        tipo: 'Evento Cultural',
        tema: 'Feria Universitaria del Libro y Encuentro de Escritores UAQ',
        cuerpo: 'Exposición editorial, presentaciones de libros, venta con descuento para estudiantes y mesas de debate en la explanada de Rectoría durante toda la semana.',
        urgencia: NivelUrgencia.BAJA,
      },
      {
        tipo: 'Aviso de Coordinación',
        tema: 'Inicio del proceso de registro al Servicio Social y Prácticas Profesionales',
        cuerpo: 'Plática de inducción obligatoria para alumnos de 7° semestre en adelante. Registro en línea mediante el Sistema Integral de Servicio Social.',
        urgencia: NivelUrgencia.ALTA,
      },
      {
        tipo: 'Taller Especializado',
        tema: 'Machine Learning Aplicado al Análisis de Datos Clínicos e Industriales',
        cuerpo: 'Aprende a entrenar modelos predictivos supervisados y no supervisados utilizando Python, Scikit-Learn y TensorFlow en laboratorios especializados.',
        urgencia: NivelUrgencia.MEDIA,
      },
      {
        tipo: 'Aviso General',
        tema: 'Concurso de Proyectos Emprendedores e Innovación Universitaria',
        cuerpo: 'Presenta tu idea de base tecnológica ante incubadoras de empresas y ángeles inversionistas de Querétaro. Premios de capital semilla a los tres mejores proyectos.',
        urgencia: NivelUrgencia.MEDIA,
      },
      {
        tipo: 'Aviso de Coordinación',
        tema: 'Publicación de calendario oficial de exámenes ordinarios y extraordinarios',
        cuerpo: 'Consulta en el portal web de la facultad la distribución de fechas, horarios y aulas asignadas para el periodo de evaluaciones del semestre.',
        urgencia: NivelUrgencia.ALTA,
      },
      {
        tipo: 'Aviso Urgente',
        tema: 'Alerta de contingencia ambiental: actividades físicas al aire libre suspendidas',
        cuerpo: 'Debido a la mala calidad del aire reportada por autoridades ambientales, quedan suspendidas las actividades deportivas al aire libre hasta nuevo aviso.',
        urgencia: NivelUrgencia.URGENTE,
      },
      {
        tipo: 'Evento Deportivo',
        tema: 'Torneo Interfacultades Copa Valores UAQ 2026',
        cuerpo: 'Inscripciones abiertas para las disciplinas de básquetbol, fútbol soccer, tochito bandera y atletismo. Consulta la convocatoria en la coordinación deportiva.',
        urgencia: NivelUrgencia.BAJA,
      },
      {
        tipo: 'Aviso General',
        tema: 'Donación voluntaria de sangre y jornada de salud preventiva UAQ',
        cuerpo: 'Unidad móvil de banco de sangre y módulos de vacunación preventiva ubicados en el estacionamiento principal de la facultad de 09:00 a 13:00 hrs.',
        urgencia: NivelUrgencia.BAJA,
      },
      {
        tipo: 'Taller Especializado',
        tema: 'Introducción a Cloud Architecture en AWS y Google Cloud Platform',
        cuerpo: 'Laboratorio práctico de despliegue en la nube, configuración de redes virtuales VPC, balanceadores de carga y almacenamiento distribuido.',
        urgencia: NivelUrgencia.MEDIA,
      },
    ];

    const imagenesUnsplash = [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800',
    ];

    const publicadores = [admin, ...coordinadores, ...docentes];

    for (let i = 0; i < temasAvisosFaker.length; i++) {
      const item = temasAvisosFaker[i];
      const autorAviso = faker.helpers.arrayElement(publicadores);
      // Algunos avisos asignados a facultades y otros transversales/generales (null)
      const facDestino = faker.helpers.arrayElement([...facultadesGuardadas, null]);

      avisosCatalogo.push({
        titulo: `${item.tipo}: ${item.tema}`,
        contenido: `${item.cuerpo} Detalle adicional emitido el ${faker.date.recent({ days: 10 }).toLocaleDateString('es-MX')} por la coordinación institucional de la Universidad Autónoma de Querétaro.`,
        urgencia: item.urgencia,
        estadoPublicacion: i === 0 ? EstadoModeracion.PENDIENTE : EstadoModeracion.APROBADA,
        facultadId: facDestino ? facDestino.id : fif.id,
        autorId: autorAviso.id,
        imagenesPortadaUrl: faker.helpers.arrayElement(imagenesUnsplash),
      });
    }

    const avisosGuardados: Aviso[] = [];
    for (const a of avisosCatalogo) {
      let aviso = await avisosRepo.findOne({ where: { titulo: a.titulo } });
      if (!aviso) {
        aviso = avisosRepo.create(a);
        await avisosRepo.save(aviso);
      }
      avisosGuardados.push(aviso);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. LECTURAS DE AVISOS (Acuses confirmados)
    // ─────────────────────────────────────────────────────────────
    console.log('[5/7] Registrando Lecturas y Acuses de Recibo...');
    const avisoUrgente = avisosGuardados[0];
    const avisoAlta = avisosGuardados[1];

    for (let i = 0; i < 12; i++) {
      const estudiante = estudiantes[i];
      if (estudiante && avisoUrgente) {
        const existe = await lecturasRepo.findOneBy({
          avisoId: avisoUrgente.id,
          usuarioId: estudiante.id,
        });
        if (!existe) {
          await lecturasRepo.save(
            lecturasRepo.create({
              avisoId: avisoUrgente.id,
              usuarioId: estudiante.id,
              fechaLectura: faker.date.recent({ days: 2 }),
            }),
          );
        }
      }

      if (estudiante && avisoAlta && i % 2 === 0) {
        const existe = await lecturasRepo.findOneBy({
          avisoId: avisoAlta.id,
          usuarioId: estudiante.id,
        });
        if (!existe) {
          await lecturasRepo.save(
            lecturasRepo.create({
              avisoId: avisoAlta.id,
              usuarioId: estudiante.id,
              fechaLectura: faker.date.recent({ days: 3 }),
            }),
          );
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. GUÍAS Y TRÁMITES OFICIALES CON PASOS SECUENCIALES
    // ─────────────────────────────────────────────────────────────
    console.log('[6/7] Generando Guias y Tramites con Pasos...');
    const guiasCatalogo = [
      {
        titulo: 'Guia Integral de Titulacion por Tesis o Proyecto Terminal',
        descripcion:
          'Conoce el paso a paso institucional para registrar tu protocolo de tesis, designar jurado revisor y programar tu fecha de examen profesional en la Facultad de Informática.',
        autorId: coordinador.id,
        facultadId: fif.id,
        imagenUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
        pasos: [
          {
            ordenPaso: 1,
            tituloPaso: 'Registro y validacion de anteproyecto',
            descripcionDetallada:
              'Presenta el formato F-TIT-01 debidamente firmado por tu director de tesis y aprobado por el coordinador de línea terminal.',
            imagenIlustrativaUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
          },
          {
            ordenPaso: 2,
            tituloPaso: 'Desarrollo de investigacion y seminario de avances',
            descripcionDetallada:
              'Cumplir con un mínimo de 6 meses de trabajo y presentar al menos 2 reportes de avance con visto bueno del comité evaluador.',
            imagenIlustrativaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
          },
          {
            ordenPaso: 3,
            tituloPaso: 'Votos aprobatorios y Examen de Grado',
            descripcionDetallada:
              'Reunir los 3 votos aprobatorios de los sinodales, liberar pago de título y solicitar fecha para la defensa pública en el aula magna.',
            imagenIlustrativaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
          },
        ],
      },
      {
        titulo: 'Proceso de Registro y Liberacion de Servicio Social',
        descripcion:
          'Trámite obligatorio para estudiantes con el 70% de créditos cubiertos. Duración mínima de 480 horas en un periodo no menor a 6 meses.',
        autorId: coordinador.id,
        facultadId: fif.id,
        imagenUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
        pasos: [
          {
            ordenPaso: 1,
            tituloPaso: 'Seleccion de programa en el portal SISS',
            descripcionDetallada:
              'Ingresa con tu expediente al portal institucional de Servicio Social y postúlate a una plaza avalada por la universidad.',
          },
          {
            ordenPaso: 2,
            tituloPaso: 'Entrega de Carta de Aceptacion',
            descripcionDetallada:
              'Sube al sistema tu carta sellada y firmada por la dependencia receptora durante los primeros 10 días hábiles.',
          },
          {
            ordenPaso: 3,
            tituloPaso: 'Reportes trimestrales y Carta de Liberacion',
            descripcionDetallada:
              'Presenta 2 reportes bimestrales/trimestrales y al concluir entrega la carta de terminación oficial para emitir la constancia de acreditación.',
          },
        ],
      },
    ];

    for (const g of guiasCatalogo) {
      let guia = await guiasRepo.findOne({ where: { titulo: g.titulo } });
      if (!guia) {
        guia = guiasRepo.create({
          titulo: g.titulo,
          descripcion: g.descripcion,
          autorId: g.autorId,
          facultadId: g.facultadId,
          imagenUrl: g.imagenUrl,
          pasos: g.pasos.map((p: any) => ({
            ordenPaso: p.ordenPaso,
            tituloPaso: p.tituloPaso,
            descripcionDetallada: p.descripcionDetallada,
            imagenIlustrativaUrl: p.imagenIlustrativaUrl,
          })) as PasoGuia[],
        });
        await guiasRepo.save(guia);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. FOROS COMUNITARIOS (Publicaciones y Comentarios con Faker)
    // ─────────────────────────────────────────────────────────────
    console.log('[7/7] Generando Publicaciones y Comentarios de Foros con Faker...');
    const temasForo = [
      {
        titulo: 'Que lenguaje recomiendan para empezar en Desarrollo Web este semestre?',
        contenido:
          'Hola a todos. Estoy en segundo semestre de Ingeniería de Software y quiero empezar a hacer proyectos personales. ¿Recomiendan empezar con TypeScript + React o enfocarme primero en backend con Node / Python?',
        categoria: 'Académico',
      },
      {
        titulo: 'Duda con el tramite de revalidacion de materias por movilidad academica',
        contenido:
          'Alguien que haya ido de intercambio a España o Canadá el año pasado, ¿cuánto tiempo antes se debe entregar la tabla de homologación en secretaría académica?',
        categoria: 'Trámites',
      },
      {
        titulo: 'Buscamos 1 integrante para equipo de Hackathon FIF (Frontend/Diseno UI)',
        contenido:
          'Somos 2 desarrolladores de backend y algoritmos. Buscamos a alguien que maneje Figma, Tailwind CSS o Next.js para completar equipo de 3 para el Hackathon de la próxima semana.',
        categoria: 'Convocatorias',
      },
      {
        titulo: 'Recomendaciones de bibliografia para el examen de Arquitectura de Computadoras',
        contenido:
          '¿Alguien tiene apuntes o exámenes muestra del profesor Navarro? Estamos repasando para el segundo examen parcial.',
        categoria: 'Dudas',
      },
      {
        titulo: 'Organizacion de club de estudio para Certificacion AWS Cloud Practitioner',
        contenido:
          'Queremos formar un grupo de estudio de 10 personas para aprovechar los cupones de descuento institucionales que ofrece la universidad.',
        categoria: 'General',
      },
    ];

    for (let i = 0; i < temasForo.length; i++) {
      const tema = temasForo[i];
      const autorPost = estudiantes[i % estudiantes.length];

      let publicacion = await forosRepo.findOne({ where: { titulo: tema.titulo } });
      if (!publicacion) {
        publicacion = forosRepo.create({
          titulo: tema.titulo,
          contenido: tema.contenido,
          categoria: tema.categoria,
          autorId: autorPost.id,
          votos: faker.number.int({ min: 2, max: 28 }),
          esFijado: i === 0,
          estaCerrado: false,
        });
        await forosRepo.save(publicacion);

        const numComentarios = faker.number.int({ min: 2, max: 4 });
        for (let j = 0; j < numComentarios; j++) {
          const autorComentario = faker.helpers.arrayElement(
            j % 2 === 0 ? docentes : estudiantes,
          );

          const comentario = comentariosRepo.create({
            publicacionId: publicacion.id,
            autorId: autorComentario.id,
            contenido: faker.helpers.arrayElement([
              'Totalmente de acuerdo. Recomiendo que comiences con TypeScript, ya que te dara mejores bases de tipado estatico.',
              'En secretaria academica atienden de lunes a viernes de 09:00 a 14:00 hrs. Lleva tu kardex impreso.',
              'Me interesa unirme al equipo. Te mande mensaje por correo institucional con mi portafolio en GitHub.',
              'Excelente iniciativa. Si necesitan apoyo con materiales o una sala en la facultad, acerquense a coordinacion.',
              'Revisen el libro de Tanenbaum, vienen ejemplos casi identicos a los del laboratorio.',
            ]),
            votos: faker.number.int({ min: 1, max: 15 }),
          });
          await comentariosRepo.save(comentario);
        }
      }
    }

    console.log('\n========================================');
    console.log('   BASE DE DATOS POBLADA EXITOSAMENTE!    ');
    console.log('========================================\n');
    console.log(`Facultades registradas: ${facultadesGuardadas.length} (Catálogo + Emergentes Faker)`);
    console.log(`Usuarios registrados:   ${todosLosUsuarios.length} (${estudiantes.length} estudiantes, ${docentes.length} docentes, ${coordinadores.length} coordinadores, 1 admin)`);
    console.log(`Avisos registrados:     ${avisosGuardados.length} (Urgentes, Alta, Media y Baja prioridad con Faker)`);
    console.log('\nCUENTAS DE PRUEBA PRINCIPALES (Contraseña: Uaq2026!):');
    console.log('----------------------------------------------------');
    console.log('Administrador:     admin@uaq.mx           (Expediente: 10001)');
    console.log('Coordinacion FIF:  coordinador.fif@uaq.mx   (Expediente: 10002)');
    console.log('Coordinacion FI:   coordinador.fi@uaq.mx    (Expediente: 10010)');
    console.log('Docente FIF:       docente.fif@uaq.mx       (Expediente: 10003)');
    console.log('Docente FI:        docente.fi@uaq.mx        (Expediente: 10004)');
    console.log('Estudiante FIF:    alumno1@alumnos.uaq.mx   (Expediente: 290001)');
    console.log('Estudiante FIF 2:  alumno2@alumnos.uaq.mx   (Expediente: 290002)');
    console.log(`...y ${todosLosUsuarios.length - 7} cuentas adicionales generadas dinámicamente con Faker.\n`);
  } catch (error) {
    console.error('Error durante la ejecucion del seeder:', error);
  } finally {
    await app.close();
  }
}

runSeed();

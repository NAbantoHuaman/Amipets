import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Establece el color de fondo de una celda."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Establece márgenes internos de una celda (en dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for margin_name, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{margin_name}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    """Aplica bordes suaves y elegantes a la tabla para Word."""
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def create_report():
    base_dir = r"c:\Users\USER\Downloads\app\Amipets"
    img_dir = os.path.join(base_dir, "assets", "images")
    output_docx = os.path.join(base_dir, "DOCUMENTO_ENTREGA_INFORME.docx")

    doc = Document()

    # Márgenes estándar (2.5 cm = 0.984 inches)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Estilos de base
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("INFORME TÉCNICO: APLICACIÓN MÓVIL AMIPETS")
    run_title.bold = True
    run_title.font.size = Pt(20)
    run_title.font.color.rgb = RGBColor(139, 94, 60) # Amipets Warm Brown

    # Subtítulo
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Sistema de Gestión de Solicitudes de Atención para Clínica Veterinaria Amipets")
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(100, 116, 139) # Slate 500

    # Datos institucionales
    p_inst = doc.add_paragraph()
    p_inst.paragraph_format.space_after = Pt(14)
    r1 = p_inst.add_run("Escuela de Tecnología — IDAT\n")
    r1.bold = True
    r2 = p_inst.add_run("Curso: Desarrollo de Aplicaciones Móviles")
    r2.font.color.rgb = RGBColor(71, 85, 105)

    # Línea divisoria
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(12)
    run_div = p_div.add_run("—" * 48)
    run_div.font.color.rgb = RGBColor(203, 213, 225)

    # Encabezado de Integrantes
    h_int = doc.add_heading(level=2)
    h_int.paragraph_format.space_before = Pt(8)
    h_int.paragraph_format.space_after = Pt(8)
    r_int = h_int.add_run("Integrantes del Equipo")
    r_int.font.size = Pt(14)
    r_int.bold = True
    r_int.font.color.rgb = RGBColor(30, 41, 59)

    # TABLA 1: INTEGRANTES
    table_int = doc.add_table(rows=4, cols=3)
    table_int.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_int, color="CBD5E1", sz="6")

    col_widths = [Inches(0.6), Inches(2.4), Inches(3.5)]
    headers = ["N°", "Integrante", "Rol en el Proyecto"]

    # Fila de Cabecera
    hdr_row = table_int.rows[0]
    for i, title in enumerate(headers):
        cell = hdr_row.cells[i]
        cell.width = col_widths[i]
        cell.text = title
        set_cell_background(cell, "1E293B") # Dark Slate
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(10.5)

    # Filas de Datos
    data_integrantes = [
        ("1", "Nestor Jose Abanto Huaman", "Arquitectura de Software, Modelado de Datos y Gestión de Estado Global (models/, store/, context/)"),
        ("2", "Elmo Torres Ordoñez", "Diseño UI/UX, Sistema de Diseño, Tokens y Componentes Reutilizables (components/, theme/)"),
        ("3", "Joel Yaro Leguia", "Pantallas Asistenciales, Navegación, Lógica de Negocio y Flujo CRUD (screens/, navigation/, utils/)")
    ]

    for idx, (num, name, role) in enumerate(data_integrantes, start=1):
        row = table_int.rows[idx]
        bg_color = "FFFFFF" if idx % 2 != 0 else "F8FAFC"
        for col_idx, text in enumerate([num, name, role]):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            cell.text = text
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(10)
                if col_idx == 1:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ==========================================
    # SECCIÓN 1: Descripción y Objetivos
    # ==========================================
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. Descripción del Caso y Objetivo")
    r_h1.font.size = Pt(16)
    r_h1.bold = True
    r_h1.font.color.rgb = RGBColor(139, 94, 60)

    h1_1 = doc.add_heading(level=2)
    h1_1.paragraph_format.space_before = Pt(8)
    h1_1.paragraph_format.space_after = Pt(4)
    h1_1.add_run("1.1 Contexto o Situación Problemática").font.size = Pt(13)

    p_ctx = doc.add_paragraph(
        "Una clínica veterinaria que brinda servicios como consultas médicas, vacunación, atención de emergencias y grooming "
        "recibe diariamente múltiples solicitudes de atención de tutores de mascotas. Tradicionalmente, estas solicitudes se registraban "
        "de manera informal a través de llamadas telefónicas y mensajes de WhatsApp.\n\n"
        "Esta práctica generaba inconvenientes operativos graves:"
    )
    p_ctx.paragraph_format.space_after = Pt(4)

    bullet_problems = [
        ("Pérdida de información: ", "Pérdida de síntomas, historial de contacto y datos clave de la mascota."),
        ("Duplicidad de registros: ", "Re-inscripciones involuntarias por diferentes canales sin consolidación."),
        ("Falta de claridad en el estado clínico: ", "Desconocimiento de si el paciente está en sala de espera (PENDIENTE), en quirófano/consulta (EN_ATENCION) o si ya fue dado de alta (FINALIZADO)."),
        ("Retraso en la atención de urgencias: ", "Inexistencia de un orden de prioridad visual que coloque a los pacientes en estado crítico en los primeros turnos de guardia.")
    ]
    for b_title, b_desc in bullet_problems:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r_bt = bp.add_run(b_title)
        r_bt.bold = True
        bp.add_run(b_desc)

    h1_2 = doc.add_heading(level=2)
    h1_2.paragraph_format.space_before = Pt(10)
    h1_2.paragraph_format.space_after = Pt(4)
    h1_2.add_run("1.2 Objetivo del Proyecto").font.size = Pt(13)

    p_obj = doc.add_paragraph(
        "Diseñar y construir una aplicación móvil en React Native con TypeScript, sin persistencia en base de datos externa "
        "(gestión reactiva en memoria mediante Context API y useReducer), que organice y gestione eficientemente el ciclo de vida "
        "de las solicitudes de atención, aplicando:"
    )
    p_obj.paragraph_format.space_after = Pt(4)

    obj_bullets = [
        "Fundamentos de desarrollo móvil en React Native y Expo.",
        "Arquitectura desacoplada en capas (screens, components, store, context, models, utils, theme).",
        "Uso obligatorio de Hooks (useState, useEffect, useReducer, useContext).",
        "Principios avanzados de diseño visual y experiencia de usuario (UI/UX) con interfaces atractivas, fluidas y profesionales."
    ]
    for ob in obj_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        bp.add_run(ob)

    # ==========================================
    # SECCIÓN 2: Arquitectura del Sistema
    # ==========================================
    h2 = doc.add_heading(level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. Breve Explicación de la Arquitectura del Sistema")
    r_h2.font.size = Pt(16)
    r_h2.bold = True
    r_h2.font.color.rgb = RGBColor(139, 94, 60)

    doc.add_paragraph(
        "La aplicación fue desarrollada siguiendo una arquitectura modular en capas con alta cohesión y bajo acoplamiento:"
    )

    # Tabla de Arquitectura estructurada para Word
    table_arch = doc.add_table(rows=5, cols=2)
    table_arch.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_arch, color="CBD5E1", sz="6")
    arch_widths = [Inches(2.2), Inches(4.3)]

    arch_layers = [
        ("Capa de Navegación", "RootNavigator y MainTabs (Navegación por pestañas inferiores persistentes: Inicio, Solicitudes, Calendario, Configuración y stack modal para Crear/Editar y Ficha de Detalle)."),
        ("Capa de Presentación (Screens)", "WelcomeScreen (Login), HomeScreen (Dashboard), RequestsScreen (Directorio y Filtros), CalendarScreen (Agenda), CreateRequestScreen (Formulario) y RequestDetailScreen (Ficha Clínica)."),
        ("Componentes UI Reutilizables", "RequestCard, FormField, StatusChip, PriorityChip, ConfirmDialog, SearchBar, FilterTabs, EmptyState, PressableScale y Tokens de diseño."),
        ("Gestión de Estado Global", "RequestsProvider (useReducer puro con inmutabilidad estricta), RequestsContext, ToastContext (alertas no bloqueantes) y AuthContext (sesión médica)."),
        ("Capa de Dominio y Modelado", "VeterinaryRequest (id, cliente, teléfono, mascota, especie, servicio, prioridad, estado, fecha ISO), validadores y formateadores de fecha relativa.")
    ]

    for idx, (capa, desc) in enumerate(arch_layers):
        row = table_arch.rows[idx]
        bg_col = "F1F5F9" if idx % 2 == 0 else "FFFFFF"
        
        c0 = row.cells[0]
        c0.width = arch_widths[0]
        c0.text = capa
        set_cell_background(c0, "1E293B" if idx == 0 else bg_col)
        set_cell_margins(c0, top=120, bottom=120, left=150, right=150)
        p0 = c0.paragraphs[0]
        for run in p0.runs:
            run.font.bold = True
            run.font.size = Pt(10)
            if idx == 0:
                run.font.color.rgb = RGBColor(255, 255, 255)

        c1 = row.cells[1]
        c1.width = arch_widths[1]
        c1.text = desc
        set_cell_background(c1, "F8FAFC" if idx == 0 else bg_col)
        set_cell_margins(c1, top=120, bottom=120, left=150, right=150)
        p1 = c1.paragraphs[0]
        for run in p1.runs:
            run.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Detalle de pantallas
    h2_4 = doc.add_heading(level=2)
    h2_4.paragraph_format.space_before = Pt(8)
    h2_4.paragraph_format.space_after = Pt(4)
    h2_4.add_run("2.4 Catálogo de Pantallas de la Aplicación (src/screens/)").font.size = Pt(13)

    screens_list = [
        ("WelcomeScreen: ", "Pantalla de bienvenida con autenticación veterinaria (admin/admin), logo oficial de Amipets y validación en tiempo real."),
        ("HomeScreen: ", "Dashboard asistencial con saludo médico al Dr. Carlos Mendoza, semáforo de urgencias activas, contadores en vivo, accesos rápidos a servicios clínicos y solicitudes prioritarias."),
        ("RequestsScreen: ", "Directorio integral de solicitudes con buscador reactivo por mascota, tutor o teléfono, selector de pestañas de estado y chips de filtro por nivel de prioridad."),
        ("CalendarScreen: ", "Agenda clínica y calendario médico interactivo para la visualización cronológica de atenciones, selector de fechas y sincronización reactiva con las solicitudes de la clínica."),
        ("CreateRequestScreen: ", "Formulario asistido para el registro y edición de pacientes con selector visual de especie, nivel de urgencia y validaciones en línea debajo de cada campo."),
        ("RequestDetailScreen: ", "Ficha clínica del paciente con controles de un solo toque para transición de estados, ajuste de prioridad médica, botón de llamada telefónica directa y confirmación de eliminación."),
        ("SettingsScreen: ", "Perfil profesional de la clínica, gestión de sedes, tarifario médico interactivo y utilidades del sistema.")
    ]
    for sc_title, sc_desc in screens_list:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r_sct = bp.add_run(sc_title)
        r_sct.bold = True
        bp.add_run(sc_desc)

    # ==========================================
    # SECCIÓN 3: Hooks Obligatorios
    # ==========================================
    h3 = doc.add_heading(level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. Uso de Hooks Obligatorios en el Proyecto")
    r_h3.font.size = Pt(16)
    r_h3.bold = True
    r_h3.font.color.rgb = RGBColor(139, 94, 60)

    # TABLA 2: HOOKS FORMATEADA PARA WORD
    table_hooks = doc.add_table(rows=4, cols=3)
    table_hooks.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_hooks, color="CBD5E1", sz="6")

    hook_widths = [Inches(1.5), Inches(2.3), Inches(2.7)]
    hook_headers = ["Hook Obligatorio", "Archivo(s) de Implementación", "Justificación Técnica"]

    hdr_h_row = table_hooks.rows[0]
    for i, title in enumerate(hook_headers):
        cell = hdr_h_row.cells[i]
        cell.width = hook_widths[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=140, bottom=140, left=150, right=150)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(10)

    hooks_data = [
        (
            "useState",
            "• CreateRequestScreen.tsx\n• WelcomeScreen.tsx\n• RequestsScreen.tsx\n• CalendarScreen.tsx\n• RequestDetailScreen.tsx",
            "Controla el estado reactivo local: valores de los inputs, errores de validación, filtros seleccionados, términos de búsqueda, fecha activa de agenda y visibilidad de diálogos modales."
        ),
        (
            "useEffect",
            "• RequestsProvider.tsx\n• RequestsScreen.tsx\n• CreateRequestScreen.tsx\n• ConfirmDialog.tsx",
            "Simula la carga de datos iniciales (setTimeout), sincroniza parámetros de navegación enviados desde el Dashboard, actualiza el reloj de registro en vivo y activa animaciones."
        ),
        (
            "useReducer + useContext",
            "• RequestsProvider.tsx\n• RequestsContext.ts\n• requestsReducer.ts",
            "Centraliza el CRUD en memoria de toda la aplicación, asegurando inmutabilidad en las modificaciones y acceso uniforme desde cualquier pantalla sin prop drilling."
        )
    ]

    for idx, (hk_name, hk_files, hk_just) in enumerate(hooks_data, start=1):
        row = table_hooks.rows[idx]
        bg_color = "FFFFFF" if idx % 2 != 0 else "F8FAFC"
        for col_idx, text in enumerate([hk_name, hk_files, hk_just]):
            cell = row.cells[col_idx]
            cell.width = hook_widths[col_idx]
            cell.text = text
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=140, bottom=140, left=150, right=150)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(9.5)
                if col_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(139, 94, 60)

    # SALTO DE PÁGINA ANTES DE LAS CAPTURAS
    doc.add_page_break()

    # ==========================================
    # SECCIÓN 4: Evidencias Visuales
    # ==========================================
    h4 = doc.add_heading(level=1)
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(8)
    r_h4 = h4.add_run("4. Evidencias Visuales y Capturas de Pantalla")
    r_h4.font.size = Pt(16)
    r_h4.bold = True
    r_h4.font.color.rgb = RGBColor(139, 94, 60)

    screens_images = [
        (
            "4.1 Pantalla de Bienvenida y Login",
            "Login.jpeg",
            [
                "Cabecera con identidad corporativa de la clínica veterinaria Amipets.",
                "Campos de usuario y contraseña con botón de inicio de sesión rápido (admin / admin).",
                "Mensajes de validación en tiempo real debajo de cada campo ante ingresos incorrectos."
            ]
        ),
        (
            "4.2 Pantalla Principal (Dashboard de Inicio)",
            "Pantalla Principal.jpeg",
            [
                "Saludo personalizado al Dr. Carlos Mendoza con fecha y turno en curso.",
                "Alerta destacada de 'Urgencias Activas' con acceso inmediato a casos críticos.",
                "Tarjetas resumen con contadores en vivo: Pendientes, En atención y Finalizados.",
                "Accesos directos por tipo de servicio (Consulta, Vacunación, Emergencia, Grooming)."
            ]
        ),
        (
            "4.3 Listado de Solicitudes con Buscador y Filtros",
            "Solicitudes con buscador y filtros.jpeg",
            [
                "Barra de búsqueda reactiva por mascota, cliente o teléfono.",
                "Filtro por pestañas de estado (Todas, Pendiente, En atención, Finalizado) con contador dinámico.",
                "Chips de filtro por prioridad (Urgente, Alta, Media, Baja).",
                "Tarjetas tipo Card con avatar de la mascota, chips de estado/prioridad y hora relativa."
            ]
        ),
        (
            "4.4 Agenda y Calendario Clínico",
            "Calendario.jpeg",
            [
                "Selector horizontal de días con indicador de fecha activa y resumen diario.",
                "Lista cronológica de citas y atenciones programadas ordenadas por horario.",
                "Conexión reactiva con el estado global de solicitudes de la clínica veterinaria.",
                "Chips de estado y tipo de servicio médico para rápida identificación visual."
            ]
        ),
        (
            "4.5 Formulario de Registro y Edición de Solicitudes",
            "Formulario de crear solicitud.jpeg",
            [
                "Selector de especie con avatares circulares (Perro, Gato, Conejo, Otro).",
                "Selector de servicio médico e indicación de nivel de prioridad.",
                "Validaciones visibles debajo de cada campo ante datos faltantes o teléfonos inválidos.",
                "Generación y asignación automática de fecha y hora de registro."
            ]
        ),
        (
            "4.6 Ficha Clínica de la Mascota y Ciclo de Vida",
            "Ficha del paciente y editar solicitud.jpeg",
            [
                "Identificador único de atención y foto representativa de la mascota.",
                "Ficha de contacto del tutor con botón de llamada telefónica directa.",
                "Controles de un solo toque para cambiar de estado (Pendiente, En atención, Finalizado).",
                "Selector rápido de nivel de prioridad y botón de acceso a edición completa."
            ]
        ),
        (
            "4.7 Diálogo Modal de Confirmación para Acciones Destructivas",
            "Modal de confirmacion eliminar.jpeg",
            [
                "Diálogo modal emergente con énfasis en advertencia visual de seguridad.",
                "Opciones 'Sí, eliminar' (acción destructiva) y 'Cancelar' para evitar pérdida accidental de registros.",
                "Retroalimentación inmediata de éxito mediante Toast animado al completar la eliminación."
            ]
        )
    ]

    for title, img_filename, bullets in screens_images:
        h_s = doc.add_heading(level=2)
        h_s.paragraph_format.space_before = Pt(12)
        h_s.paragraph_format.space_after = Pt(6)
        r = h_s.add_run(title)
        r.font.size = Pt(12.5)
        r.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)

        img_path = os.path.join(img_dir, img_filename)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(8)
            # Ancho de 2.0 pulgadas (~5.1 cm) que da un alto de ~4.2 pulgadas, cabe perfectamente sin cortar
            p_img.add_run().add_picture(img_path, width=Inches(2.0))

        for b in bullets:
            bp = doc.add_paragraph(style='List Bullet')
            bp.paragraph_format.space_after = Pt(2)
            bp.add_run(b).font.size = Pt(9.5)

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # SALTO DE PÁGINA ANTES DE LA EVIDENCIA DE EXPO GO
    doc.add_page_break()

    # ==========================================
    # SECCIÓN 5: Evidencia Expo Go
    # ==========================================
    h5 = doc.add_heading(level=1)
    h5.paragraph_format.space_before = Pt(8)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. Evidencia de Ejecución en Dispositivo Móvil con Expo Go")
    r_h5.font.size = Pt(16)
    r_h5.bold = True
    r_h5.font.color.rgb = RGBColor(139, 94, 60)

    expo_img = os.path.join(img_dir, "Prueba de que estamos en Expo go.jpeg")
    if os.path.exists(expo_img):
        p_expo = doc.add_paragraph()
        p_expo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_expo.paragraph_format.space_before = Pt(6)
        p_expo.paragraph_format.space_after = Pt(10)
        p_expo.add_run().add_picture(expo_img, width=Inches(2.1))

    expo_bullets = [
        ("Entorno de ejecución: ", "Dispositivo móvil físico ejecutando la aplicación a través de Expo Go conectada al Metro Bundler de desarrollo."),
        ("Servidor de desarrollo: ", "npx expo start con Fast Refresh y compilación TypeScript en tiempo real."),
        ("Verificación de tipado estricto: ", "npx tsc --noEmit validado exitosamente con 0 errores de compilación."),
        ("Compatibilidad multiplataforma: ", "Probado y renderizado con rendimiento fluido a 60 FPS en Android y compatibilidad nativa en iOS.")
    ]
    for eb_title, eb_desc in expo_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        r_eb = bp.add_run(eb_title)
        r_eb.bold = True
        bp.add_run(eb_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ==========================================
    # SECCIÓN 6: Conclusiones
    # ==========================================
    h6 = doc.add_heading(level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(8)
    r_h6 = h6.add_run("6. Conclusiones y Logros del Proyecto")
    r_h6.font.size = Pt(16)
    r_h6.bold = True
    r_h6.font.color.rgb = RGBColor(139, 94, 60)

    conclusiones = [
        ("1. Gestión Integral del Flujo Clínico: ", "Se sustituyeron con éxito los canales informales por un sistema estructurado con estados clínicos claros (PENDIENTE, EN_ATENCION, FINALIZADO) y priorización médica por niveles de urgencia."),
        ("2. Arquitectura Escalable y Limpia: ", "La separación en capas (screens, components, store, context, models, utils, theme) garantiza alta mantenibilidad, escalabilidad y separación de responsabilidades."),
        ("3. Experiencia de Usuario Sobresaliente: ", "El diseño combina componentes de alto impacto visual, paleta de colores coherente y accesible, microinteracciones táctiles, validaciones en línea y modales de confirmación seguros."),
        ("4. Dominio de Hooks Fundamentales: ", "Se cumplió estrictamente con la implementación de useState, useEffect y el patrón useReducer + Context para el ciclo de vida CRUD reactivo en memoria.")
    ]
    for c_title, c_desc in conclusiones:
        cp = doc.add_paragraph()
        cp.paragraph_format.space_after = Pt(6)
        r_ct = cp.add_run(c_title)
        r_ct.bold = True
        r_ct.font.color.rgb = RGBColor(15, 23, 42)
        cp.add_run(c_desc)

    doc.save(output_docx)
    print(f"Documento Word generado exitosamente en: {output_docx}")

if __name__ == "__main__":
    create_report()

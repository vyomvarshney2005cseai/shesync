import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import os

def create_styled_document():
    doc = docx.Document()
    
    # Base Normal Style: 10pt Times New Roman
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Times New Roman'
    normal_font.size = Pt(10)
    normal_font.color.rgb = RGBColor(0, 0, 0)
    
    rPr = normal_style.element.get_or_add_rPr()
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), 'Times New Roman')
    rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    rFonts.set(qn('w:cs'), 'Times New Roman')
    rPr.append(rFonts)
    
    return doc

def set_section_layout(section, num_columns=2, space_twips=720, top=0.75, bottom=1.0, left=0.625, right=0.625):
    section.top_margin = Inches(top)
    section.bottom_margin = Inches(bottom)
    section.left_margin = Inches(left)
    section.right_margin = Inches(right)
    
    sectPr = section._sectPr
    cols = sectPr.xpath('./w:cols')
    if cols:
        cols[0].set(qn('w:num'), str(num_columns))
        cols[0].set(qn('w:space'), str(space_twips))
    else:
        new_cols = OxmlElement('w:cols')
        new_cols.set(qn('w:num'), str(num_columns))
        new_cols.set(qn('w:space'), str(space_twips))
        sectPr.append(new_cols)

def add_new_page_section(doc, num_columns=2, space_twips=720):
    sec = doc.add_section(WD_SECTION_START.NEW_PAGE)
    set_section_layout(sec, num_columns=num_columns, space_twips=space_twips)
    return sec

def set_run_font(run, name='Times New Roman', size_pt=10, bold=False, italic=False, color_rgb=None, small_caps=False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    if color_rgb:
        run.font.color.rgb = color_rgb
    
    rPr = run._r.get_or_add_rPr()
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), name)
    rFonts.set(qn('w:hAnsi'), name)
    rFonts.set(qn('w:cs'), name)
    rPr.append(rFonts)
    
    if small_caps:
        sc = OxmlElement('w:smallCaps')
        rPr.append(sc)

def add_title(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    set_run_font(run, name='Times New Roman', size_pt=24, bold=False, italic=False)
    return p

def add_author_block(doc, authors, affiliations):
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(2)
    p1.paragraph_format.line_spacing = 1.0
    run1 = p1.add_run(authors)
    set_run_font(run1, name='Times New Roman', size_pt=10, bold=False, italic=False)
    
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(12)
    p2.paragraph_format.line_spacing = 1.0
    run2 = p2.add_run(affiliations)
    set_run_font(run2, name='Times New Roman', size_pt=10, bold=False, italic=False)

def add_abstract_block(doc, p1_text, p2_text, index_terms):
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(4)
    p1.paragraph_format.line_spacing = 1.0
    
    head_run = p1.add_run("Abstract—")
    set_run_font(head_run, name='Times New Roman', size_pt=9, bold=True, italic=True)
    
    body_run1 = p1.add_run(p1_text)
    set_run_font(body_run1, name='Times New Roman', size_pt=9, bold=False, italic=False)
    
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(4)
    p2.paragraph_format.line_spacing = 1.0
    
    body_run2 = p2.add_run(p2_text)
    set_run_font(body_run2, name='Times New Roman', size_pt=9, bold=False, italic=False)
    
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p3.paragraph_format.space_before = Pt(2)
    p3.paragraph_format.space_after = Pt(12)
    p3.paragraph_format.line_spacing = 1.0
    
    it_head = p3.add_run("Index Terms—")
    set_run_font(it_head, name='Times New Roman', size_pt=9, bold=True, italic=True)
    
    it_body = p3.add_run(index_terms)
    set_run_font(it_body, name='Times New Roman', size_pt=9, bold=False, italic=False)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, name='Times New Roman', size_pt=10, bold=False, italic=False, small_caps=True)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, name='Times New Roman', size_pt=10, bold=False, italic=True)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, name='Times New Roman', size_pt=10, bold=False, italic=True)
    return p

def add_body_p(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(text)
    set_run_font(run, name='Times New Roman', size_pt=10, bold=False, italic=False)
    return p

def add_bullet_p(doc, bold_prefix, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.line_spacing = 1.0
    
    bullet_run = p.add_run("•  ")
    set_run_font(bullet_run, name='Times New Roman', size_pt=10, bold=False, italic=False)
    
    if bold_prefix:
        head_run = p.add_run(bold_prefix + " ")
        set_run_font(head_run, name='Times New Roman', size_pt=10, bold=True, italic=False)
        
    body_run = p.add_run(text)
    set_run_font(body_run, name='Times New Roman', size_pt=10, bold=False, italic=False)
    return p

def add_equation_p(doc, eq_text, eq_num_str):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0
    
    run_eq = p.add_run(f"       {eq_text}")
    set_run_font(run_eq, name='Times New Roman', size_pt=10, bold=False, italic=True)
    
    run_num = p.add_run(f"    {eq_num_str}")
    set_run_font(run_num, name='Times New Roman', size_pt=10, bold=False, italic=False)
    return p

def add_caption(doc, caption_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(caption_text)
    set_run_font(run, name='Times New Roman', size_pt=8, bold=False, italic=False)
    return p

def add_reference_p(doc, num_str, ref_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.line_spacing = 1.0
    
    num_run = p.add_run(num_str + " ")
    set_run_font(num_run, name='Times New Roman', size_pt=8, bold=False, italic=False)
    
    text_run = p.add_run(ref_text)
    set_run_font(text_run, name='Times New Roman', size_pt=8, bold=False, italic=False)
    return p

def build_table(doc, col_widths, headers, rows_data, title=""):
    if title:
        p_t = doc.add_paragraph()
        p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_t.paragraph_format.space_before = Pt(6)
        p_t.paragraph_format.space_after = Pt(2)
        p_t.paragraph_format.line_spacing = 1.0
        run_t = p_t.add_run(title)
        set_run_font(run_t, name='Times New Roman', size_pt=8, bold=True, italic=False, small_caps=True)

    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    hdr_cells = table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        for r in p.runs:
            set_run_font(r, name='Times New Roman', size_pt=8, bold=True, italic=False)
        shd = parse_xml(r'<w:shd {} w:fill="F0F0F0"/>'.format(nsdecls('w')))
        hdr_cells[i]._tc.get_or_add_tcPr().append(shd)
        
    for r_vals in rows_data:
        r_cells = table.add_row().cells
        for j, val in enumerate(r_vals):
            r_cells[j].text = str(val)
            p = r_cells[j].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if (j > 0 and len(str(val)) < 16) else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                set_run_font(r, name='Times New Roman', size_pt=8, bold=False, italic=False)
                
    for row in table.rows:
        for idx, w in enumerate(col_widths):
            row.cells[idx].width = Inches(w)
            
    # Spacing after table
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)
    p_sp.paragraph_format.line_spacing = 1.0

print("Helper functions ready.")

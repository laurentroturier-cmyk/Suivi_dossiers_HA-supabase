/**
 * Éditeur de texte enrichi pour les sections CCAP
 * Utilise Tiptap avec toutes les fonctionnalités de traitement de texte
 */

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Image } from '@tiptap/extension-image';
import { FontFamily } from '@tiptap/extension-font-family';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Code2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Unlink, Image as ImageIcon,
  Table as TableIcon, Minus, Subscript as SubIcon, Superscript as SupIcon,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Pilcrow,
  Eraser, Undo, Redo, Paintbrush, Highlighter, Plus, Trash2,
  CheckSquare, Type
} from 'lucide-react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showFontPicker, setShowFontPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Désactiver history pour éviter les conflits
        history: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Subscript,
      Superscript,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('📝 Contenu HTML mis à jour:', html.substring(0, 200));
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
        'data-placeholder': placeholder || 'Saisissez le contenu...',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    
    const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
    editor.chain().focus().setImage({ src: url }).run();
    setShowImageInput(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (JPG, PNG, GIF, etc.)');
      return;
    }

    // Limiter la taille à 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    // Convertir en Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      editor.chain().focus().setImage({ src: base64 }).run();
      setShowImageInput(false);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const colors = [
    '#000000', '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
    '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7', '#2563EB',
    '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777', '#E11D48',
    '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563'
  ];

  const highlights = [
    '#FEF3C7', '#FED7AA', '#FBCFE8', '#E9D5FF', '#DBEAFE', '#D1FAE5',
    '#FFE4E6', '#FFEDD5', '#FCE7F3', '#EDE9FE', '#DBEAFE', '#D1FAE5',
    'transparent'
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Barre d'outils principale */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Sélecteur de police */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontPicker(!showFontPicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className="px-2 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400 flex items-center gap-1"
            title="Police de caractères"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs">Police</span>
          </button>
          {showFontPicker && (
            <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-48">
              <div className="flex flex-col gap-1">
                {[
                  { value: 'Arial', label: 'Arial' },
                  { value: 'Times New Roman', label: 'Times New Roman' },
                  { value: 'Courier New', label: 'Courier New' },
                  { value: 'Georgia', label: 'Georgia' },
                  { value: 'Verdana', label: 'Verdana' },
                  { value: 'Helvetica', label: 'Helvetica' },
                  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
                  { value: 'Impact', label: 'Impact' },
                ].map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                      setShowFontPicker(false);
                    }}
                    className={`px-2 py-1 text-left text-sm rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 transition ${
                      editor.isActive('textStyle', { fontFamily: font.value })
                        ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetFontFamily().run();
                    setShowFontPicker(false);
                  }}
                  className="px-2 py-1 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  Par défaut
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Formatage de texte */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('bold') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Gras (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('italic') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Italique (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('underline') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Souligné (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('strike') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Barré"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Couleurs */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
            title="Couleur de texte"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              <div className="grid grid-cols-6 gap-1 w-48">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
            title="Surlignage"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {showHighlightPicker && (
            <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              <div className="grid grid-cols-6 gap-1 w-48">
                {highlights.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      if (color === 'transparent') {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().setHighlight({ color }).run();
                      }
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                    title={color === 'transparent' ? 'Supprimer' : color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Alignement */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Aligner à droite"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Justifier"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Listes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('bulletList') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('orderedList') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('taskList') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Liste de tâches"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Format spécial */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('subscript') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Indice"
        >
          <SubIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('superscript') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Exposant"
        >
          <SupIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('code') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Code inline"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('codeBlock') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Bloc de code"
        >
          <Code2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('blockquote') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Citation"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Insertion */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href;
              setLinkUrl(previousUrl || '');
              setShowLinkInput(!showLinkInput);
            }}
            className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
              editor.isActive('link') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
            }`}
            title="Insérer un lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {showLinkInput && (
            <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-64">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setLink();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setLink}
                  className="flex-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Insérer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
            title="Retirer le lien"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
            title="Insérer une image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          {showImageInput && (
            <div className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-72">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Depuis votre ordinateur
                </label>
                <label className="flex items-center justify-center w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition bg-gray-50 dark:bg-gray-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    📁 Parcourir...
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, GIF (max 5MB)
                </p>
              </div>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OU</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Depuis une URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addImage}
                  disabled={!imageUrl}
                  className="flex-1 px-2 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insérer URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageInput(false);
                    setImageUrl('');
                  }}
                  className="px-2 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
          title="Insérer un tableau"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        {editor.isActive('table') && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
              title="Ajouter une ligne"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
              title="Supprimer la ligne"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
          title="Ligne horizontale"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Titres */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 1 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 2"
        >
          H2
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 3"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 4 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 4"
        >
          H4
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 5 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 5"
        >
          H5
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('heading', { level: 6 }) ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Titre 6"
        >
          H6
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
            editor.isActive('paragraph') ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
          }`}
          title="Paragraphe normal"
        >
          <Pilcrow className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Actions */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
          title="Effacer le formatage"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Annuler (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Rétablir (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Zone d'édition */}
      <div className="bg-white dark:bg-gray-800">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

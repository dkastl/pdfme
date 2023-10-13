import type * as CSS from 'csstype';
import type { UIRenderProps } from "../types"
import {
    DEFAULT_FONT_SIZE,
    DEFAULT_ALIGNMENT,
    VERTICAL_ALIGN_TOP,
    VERTICAL_ALIGN_MIDDLE,
    VERTICAL_ALIGN_BOTTOM,
    DEFAULT_VERTICAL_ALIGNMENT,
    DEFAULT_LINE_HEIGHT,
    DEFAULT_CHARACTER_SPACING,
    DEFAULT_FONT_COLOR,
    Schema,
    calculateDynamicFontSize,
    getFontKitFont,
    getDefaultFont,
    getBrowserVerticalFontAdjustments,
} from '@pdfme/common';

const mapVerticalAlignToFlex = (verticalAlignmentValue: string | undefined) => {
    switch (verticalAlignmentValue) {
        case VERTICAL_ALIGN_TOP:
            return 'flex-start';
        case VERTICAL_ALIGN_MIDDLE:
            return 'center';
        case VERTICAL_ALIGN_BOTTOM:
            return 'flex-end';
    }
    return 'flex-start';
};

export const uiRender = async (arg: UIRenderProps) => {
    const { value, rootElement, mode, onChange, stopEditing, tabIndex, placeholder, options } = arg;
    const schema = arg.schema as Schema & {
        dynamicFontSize?: { max: number; min: number; fit: 'vertical' | 'horizontal'; };
        fontName?: string;
        fontColor?: string;
        fontSize?: number;
        alignment?: 'left' | 'center' | 'right';
        verticalAlignment?: 'top' | 'middle' | 'bottom';
        lineHeight?: number;
        characterSpacing?: number;
        backgroundColor?: string;
    };


    const font = options?.font || getDefaultFont();

    let dynamicFontSize: undefined | number = undefined;
    if (schema.dynamicFontSize && value) {
        dynamicFontSize = await calculateDynamicFontSize({
            textSchema: schema,
            font,
            value,
            startingFontSize: dynamicFontSize,
        })
    }

    const fontKitFont = await getFontKitFont(schema, font)
    // Depending on vertical alignment, we need to move the top or bottom of the font to keep
    // it within it's defined box and align it with the generated pdf.
    const { topAdj, bottomAdj } = getBrowserVerticalFontAdjustments(
        fontKitFont,
        dynamicFontSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE,
        schema.lineHeight ?? DEFAULT_LINE_HEIGHT,
        schema.verticalAlignment ?? DEFAULT_VERTICAL_ALIGNMENT
    );

    const topAdjustment = topAdj;
    const bottomAdjustment = bottomAdj;

    const container = document.createElement('div');
    function getBackgroundColor(mode: 'form' | 'viewer', value: string, schema: Schema) {
        if (mode === 'form' && value && schema.backgroundColor) {
            return schema.backgroundColor as string;
        } else if (mode === 'viewer') {
            return (schema.backgroundColor as string) ?? 'transparent';
        } else {
            return 'rgb(242 244 255 / 75%)';
        }
    }

    const containerStyle: CSS.Properties = {
        padding: 0,
        resize: 'none',
        backgroundColor: getBackgroundColor(mode, value, schema),
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mapVerticalAlignToFlex(schema.verticalAlignment),
        width: '100%',
        height: '100%',
    };
    Object.assign(container.style, containerStyle);
    rootElement.innerHTML = '';
    rootElement.appendChild(container);


    const fontStyles: CSS.Properties = {
        fontFamily: schema.fontName ? `'${schema.fontName}'` : 'inherit',
        color: schema.fontColor ? schema.fontColor : DEFAULT_FONT_COLOR,
        fontSize: `${dynamicFontSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE}pt`,
        letterSpacing: `${schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING}pt`,
        lineHeight: `${schema.lineHeight ?? DEFAULT_LINE_HEIGHT}em`,
        textAlign: schema.alignment ?? DEFAULT_ALIGNMENT,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    };

    if (mode === 'form') {
        const textarea = document.createElement('textarea');
        const textareaStyle: CSS.Properties = {
            padding: 0,
            resize: 'none',
            border: 'none',
            outline: 'none',
            paddingTop: topAdjustment + 'px',
            backgroundColor: 'transparent',
            width: '100%',
            height: '100%',
        };
        Object.assign(textarea.style, textareaStyle, fontStyles);
        textarea.rows = 1;
        textarea.placeholder = placeholder || "";
        textarea.tabIndex = tabIndex || 0;

        textarea.addEventListener('change', (e: Event) => onChange && onChange((e.target as HTMLTextAreaElement).value));
        textarea.addEventListener('blur', () => stopEditing && stopEditing());
        textarea.value = value;
        container.appendChild(textarea);
        textarea.setSelectionRange(value.length, value.length);
        textarea.focus();
    } else {
        const div = document.createElement('div');
        const divStyle: CSS.Properties = {
            ...fontStyles,
            marginBottom: bottomAdjustment + 'px',
            paddingTop: topAdjustment + 'px',
        };
        Object.assign(div.style, divStyle);
        div.innerHTML = value.split('').map((l: string, i: number) => (
            `<span style="letter-spacing:${String(value).length === i + 1 ? 0 : 'inherit'};">${l}</span>`
        )).join('');

        container.appendChild(div);

    }
}
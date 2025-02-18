import {
	Button,
	// eslint-disable-next-line
	__experimentalInputControl as InputControl,
	SelectControl,
} from '@wordpress/components';
import { Font } from 'lib-font';
import { __ } from '@wordpress/i18n';
import { variableAxesToCss } from '../demo-text-input/utils';

function UploadFontForm( {
	formData,
	setFormData,
	resetFormData,
	isFormValid,
	setAxes,
} ) {
	// pickup the nonce from the input printed in the server
	const nonce = document.querySelector( '#nonce' ).value;

	const onFileSelectChange = ( event ) => {
		const file = event.target.files[ 0 ];

		if ( ! file ) {
			resetFormData();
			return;
		}

		// Use FileReader to, well, read the file
		const reader = new FileReader();
		reader.readAsArrayBuffer( file );

		reader.onload = () => {
			// Create a font object
			const fontObj = new Font( 'Uploaded Font' );

			// Pass the buffer, and the original filename
			fontObj.fromDataBuffer( reader.result, file.name );

			fontObj.onload = ( onloadEvent ) => {
				// Map the details LibFont gathered from the font to the
				// "font" variable
				const font = onloadEvent.detail.font;

				// From all the OpenType tables in the font, take the "name"
				// table so we can inspect it further
				const { name } = font.opentype.tables;

				// From the name table, take the entry with ID "1". This is
				// the Font Family name. More info and names you can grab:
				// https://docs.microsoft.com/en-us/typography/opentype/spec/name

				const fontName = name.get( 1 );
				const isItalic = name
					.get( 2 )
					.toLowerCase()
					.includes( 'italic' );
				const fontWeight =
					font.opentype.tables[ 'OS/2' ].usWeightClass || 'normal';

				// Variable fonts info
				const isVariable = !! font.opentype.tables.fvar;
				const isVariableWeight =
					isVariable &&
					!! font.opentype.tables.fvar.axes.find(
						( { tag } ) => tag === 'wght'
					);
				const axes = isVariable
					? font.opentype.tables.fvar.axes.reduce(
							(
								acc,
								{ tag, minValue, defaultValue, maxValue }
							) => {
								acc[ tag ] = {
									tag,
									minValue,
									defaultValue,
									maxValue,
									currentValue: defaultValue,
								};
								return acc;
							},
							{}
					  )
					: {};

				setFormData( {
					file,
					name: fontName,
					style: isItalic ? 'italic' : 'normal',
					...( ! isVariableWeight ? { weight: fontWeight } : {} ),
					variable: isVariable,
					variableWeight: isVariableWeight,
				} );
				setAxes( axes );
			};
		};
	};

	const fontVariationSettings = variableAxesToCss( formData.axes );

	return (
		<>
			<form
				method="POST"
				id="font-upload-form"
				action=""
				encType="multipart/form-data"
			>
				<input type="hidden" name="nonce" value={ nonce } />

				<div className="form-group">
					<label htmlFor="font-file">
						{ __( 'Font file:', 'create-block-theme' ) }
					</label>
					<input
						type="file"
						name="font-file"
						id="font-file"
						onChange={ onFileSelectChange }
						accept=".otf, .ttf, .woff, .woff2"
					/>
					<small>
						{ __(
							'.otf, .ttf, .woff, .woff2 file extensions supported',
							'create-block-theme'
						) }
					</small>
				</div>

				<h4>
					{ __(
						'Font face definition for this font file:',
						'create-block-theme'
					) }
				</h4>

				<div className="form-group">
					<InputControl
						label={ __( 'Font name:', 'create-block-theme' ) }
						type="text"
						name="font-name"
						id="font-name"
						placeholder={ __( 'Font name', 'create-block-theme' ) }
						value={ formData.name }
						onChange={ ( val ) =>
							setFormData( { ...formData, name: val } )
						}
					/>
				</div>

				<div className="form-group">
					<SelectControl
						label={ __( 'Font style:', 'create-block-theme' ) }
						name="font-style"
						id="font-style"
						value={ formData.style }
						onChange={ ( val ) =>
							setFormData( { ...formData, style: val } )
						}
					>
						<option value="normal">Normal</option>
						<option value="italic">Italic</option>
					</SelectControl>
				</div>

				<div className="form-group">
					<InputControl
						label={ __( 'Font weight:', 'create-block-theme' ) }
						type="text"
						name="font-weight"
						id="font-weight"
						placeholder={
							! formData.variableWeight
								? __( 'Font weight:', 'create-block-theme' )
								: ''
						}
						value={ formData.weight || '' }
						onChange={ ( val ) =>
							setFormData( { ...formData, weight: val } )
						}
						// Disable the input if the font is a variable font with the wght axis
						disabled={ formData.variableWeight }
					/>
					{ formData.variableWeight && (
						<small>
							{  }
							{ __(
								'This font is a variable font with the wght axis, for this reason the font weight selector is disabled',
								'create-block-theme'
							) }
						</small>
					) }
				</div>

				{ formData.variable && (
					<input
						type="hidden"
						name="font-variation-settings"
						value={ fontVariationSettings }
					/>
				) }
			</form>

			<Button
				variant="primary"
				type="submit"
				disabled={ ! isFormValid() }
				form="font-upload-form"
			>
				{ __( 'Upload font to your theme', 'create-block-theme' ) }
			</Button>
		</>
	);
}

export default UploadFontForm;

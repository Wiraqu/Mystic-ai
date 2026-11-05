export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, birthdate, question } = req.body;

    if (!name || !birthdate) {
        return res.status(400).json({ error: 'Nombre y fecha requeridos' });
    }

    const prompt = `Eres un guía espiritual sabio y poético. Genera una lectura mística personalizada para:

Nombre: ${name}
Fecha de nacimiento: ${birthdate}
Pregunta o intención: ${question || 'Conocer mi propósito'}

Responde ÚNICAMENTE en este formato JSON válido, sin markdown, sin explicaciones:
{
  "symbol": "un emoji de símbolo místico (☾, ✦, ☀, ✧, ☯, ⚛, ☘, ॐ, ✵)",
  "archetype": "UN ARQUETIPO EN MAYÚSCULAS, máximo 3 palabras (ej: EL VIAJERO, LA SANADORA, EL SABIO)",
  "reading": "Una lectura poética de 3-4 frases (máximo 350 caracteres), cálida, inspiradora, que hable del alma, la energía y el propósito de esta persona. Debe sentirse personal y profunda.",
  "affirmation": "Una afirmación corta y poderosa de 1 frase (máximo 100 caracteres)"
}

Sé creativo. La lectura debe sentirse única y especial, no genérica.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Limpiar posibles markdown
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const reading = JSON.parse(cleanContent);

        // Guardar para analytics (opcional)
        console.log(`Lectura generada para: ${name.substring(0, 3)}***`);

        return res.status(200).json(reading);

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ 
            error: 'Error al generar lectura',
            fallback: {
                symbol: '☾',
                archetype: 'EL VIAJERO',
                reading: 'Tu alma camina entre mundos, buscando la verdad que solo tú puedes encontrar. La energía que te rodea está en movimiento, preparándote para un despertar. Confía en tu intuición, pues ella conoce el camino.',
                affirmation: 'Soy guiado por una sabiduría más antigua que el tiempo.'
            }
        });
    }
}
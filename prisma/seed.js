const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create sample lesson
  const lesson = await prisma.lesson.create({
    data: {
      title: 'How to Order Coffee ☕',
      category: 'speaking',
      learnerLevel: 'beginner',
      durationMinutes: 5,
      content: 'Welcome to your first speaking practice! Today we will learn how to order coffee...',
      difficulty: 1,
    }
  })

  // Create exercises for the lesson
  await prisma.exercise.createMany({
    data: [
      {
        lessonId: lesson.id,
        type: 'multiple-choice',
        question: 'How do you say "Can I have a coffee, please?"',
        correctAnswer: 'Can I have a coffee, please?',
        options: JSON.stringify(['I want coffee', 'Can I have a coffee, please?', 'Give me coffee']),
        points: 10,
        hintText: 'Polite requests often start with "Can I have..."'
      }
    ]
  })

  // Create sample vocabulary words
  const words = [
    { english: 'thought', phonetic: '/θɔːt/', translationNative: 'мысль / думал', partOfSpeech: 'noun/verb', difficultyLevel: 2, learnerCategory: 'all' },
    { english: 'through', phonetic: '/θruː/', translationNative: 'через', partOfSpeech: 'preposition', difficultyLevel: 2, learnerCategory: 'all' },
    { english: 'comfortable', phonetic: '/ˈkʌmfətəbl/', translationNative: 'удобный', partOfSpeech: 'adjective', difficultyLevel: 1, learnerCategory: 'all' },
    { english: 'coffee', phonetic: '/ˈkɒfi/', translationNative: 'кофе', partOfSpeech: 'noun', difficultyLevel: 1, learnerCategory: 'all' },
  ]
  
  for (const w of words) {
    await prisma.word.create({ data: w })
  }
  
  console.log('Seeding complete! 🌸')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

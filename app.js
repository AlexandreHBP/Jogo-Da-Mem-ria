document.addEventListener('DOMContentLoaded', () => {
    //card options
    const cardArray = [
        {
            name: 'zoro1a',
            img: 'images/zoro1.jpeg'
        },
        {
            name: 'zoro2a',
            img: 'images/zoro2.jpeg'
        }, {
            name: 'zoro3a',
            img: 'images/zoro3.jpeg'
        }, {
            name: 'zoro4a',
            img: 'images/zoro4.jpeg'
        }, {
            name: 'zoro5a',
            img: 'images/zoro5.jpeg'
        }, {
            name: 'zoro6a',
            img: 'images/zoro6.jpeg'
        }, {
            name: 'zoro7a',
            img: 'images/zoro7.jpeg'
        },
        {
            name: 'zoroa',
            img: 'images/images.jpeg'
        },{
            name: 'zoro1a',
            img: 'images/zoro1.jpeg'
        },
        {
            name: 'zoro2a',
            img: 'images/zoro2.jpeg'
        }, {
            name: 'zoro3a',
            img: 'images/zoro3.jpeg'
        }, {
            name: 'zoro4a',
            img: 'images/zoro4.jpeg'
        }, {
            name: 'zoro5a',
            img: 'images/zoro5.jpeg'
        }, {
            name: 'zoro6a',
            img: 'images/zoro6.jpeg'
        }, {
            name: 'zoro7a',
            img: 'images/zoro7.jpeg'
        },
        {
            name: 'zoroa',
            img: 'images/images.jpeg'
        }
    ]
cardArray.sort(() => 0.5 - Math.random())

const grid = document.querySelector('.grid')
const resultDisplay = document.querySelector('#result')
var cardsChoosen = []
var cardsChoosenId = []
var CardsWon = []
//create your board
for (let i = 0; i  < cardArray.length; i++) {
var card = document.createElement('img')
card.setAttribute('src', 'images/Blank_image.jpg')
card.setAttribute('data-id', i)
card.addEventListener('click', flipcard)
grid.appendChild(card)
}
//check for matches
function checkForMatch() {
    var cards = document.querySelectorAll('img')
    const  option0neId = cardsChoosenId[0]
    const optiontwoId = cardsChoosenId[1]
    if(cardsChoosen[0] === cardsChoosen[1]) {
        alert('You Found a Match')
        cards[option0neId].setAttribute('src', 'images/A_black_image.jpeg')
        cards[optiontwoId].setAttribute('src', 'images/A_black_image.jpeg')
        CardsWon.push(cardsChoosen)
    }else{
        cards[option0neId].setAttribute('src', 'images/Blank_image.jpg')
        cards[optiontwoId].setAttribute('src', 'images/Blank_image.jpg')
        alert('Sorry, try again')
    }
    cardsChoosen = []
    cardsChoosenId = []
    resultDisplay.textContent = CardsWon.length
    if (CardsWon.lenght === cardArray.lenght/2) {
        resultDisplay.textContent = 'Congulatulations! You Found them all!'
    }

}
 
//flip your card
function flipcard() {
    var cardId = parseInt( this.getAttribute('data-id'))
    cardsChoosen.push(cardArray[cardId].name)
    cardsChoosenId.push(cardId)
    this.setAttribute('src', cardArray[cardId].img)
    if (cardsChoosen.length === 2) {
        setTimeout(checkForMatch, 2000)
    }
}
})


describe('Blog app', function () {
  beforeEach(function () {
    cy.request('POST', 'http://localhost:3003/api/testing/reset')
    const user = {
      name: 'Matti Luukkainen',
      username: 'mluukkai',
      password: 'salainen',
    }
    cy.request('POST', 'http://localhost:3003/api/users/', user)
    cy.visit('http://localhost:3000')
  })

  it('Login form is shown', function () {
    cy.contains('log in').click()
    cy.contains('username')
    cy.contains('password')
    cy.contains('login')
    cy.contains('cancel')
  })

  describe('Login', function () {
    it('succeeds with correct credentials', function () {
      cy.contains('log in').click()
      cy.get('#username').type('mluukkai')
      cy.get('#password').type('salainen')
      cy.get('#login-button').click()

      cy.contains('Matti Luukkainen logged-in')
    })

    it('fails with wrong credentials', function () {
      cy.contains('log in').click()
      cy.get('#username').type('mluukkai')
      cy.get('#password').type('wrong')
      cy.get('#login-button').click()

      cy.get('.error')
        .should('contain', 'Wrong credentials')
        .and('have.css', 'color', 'rgb(255, 0, 0)')
        .and('have.css', 'border-style', 'solid')

      cy.get('html').should('not.contain', 'Matti Luukkainen logged in')
    })
  })

  describe('When logged in', function () {
    beforeEach(function () {
      cy.login({ username: 'mluukkai', password: 'salainen' })
    })

    it('A blog can be created', function () {
      cy.contains('create new blog').click()
      cy.get('#title').type('a blog created by cypress')
      cy.get('#author').type('cypress')
      cy.get('#url').type('test.com')
      cy.get('#blog-create-button').click()
      cy.contains('a blog created by cypress')
    })

    describe('and a blog exists', function () {
      beforeEach(function () {
        cy.createBlog({
          title: 'another blog cypress',
          author: 'cypress',
          url: 'test.com',
        })
      })

      it('checks that users can like a blog', function () {
        cy.contains('view').click()
        cy.contains('like').click()
        cy.contains('likes 1').click()
      })

      it('user who created blog can delete it', function () {
        cy.contains('view').click()
        cy.contains('remove').click()
        cy.get('html').should('not.contain', 'another blog cypress')
      })

      it('invalid user cannot delete blog', function () {
        const user = {
          name: 'user',
          username: 'testuser',
          password: 'password',
        }
        cy.request('POST', 'http://localhost:3003/api/users/', user)
        cy.login({ username: 'testuser', password: 'password' })

        cy.contains('view').click()
        cy.contains('remove').click()

        cy.get('.error')
          .should('contain', 'Request failed with status code 401')
          .and('have.css', 'color', 'rgb(255, 0, 0)')
          .and('have.css', 'border-style', 'solid')

        cy.get('html').should('contain', 'another blog cypress')
      })
    })

    describe('and several blogs exists', function () {
      beforeEach(function () {
        cy.createBlog({
          title: 'another blog cypress 1',
          author: 'cypress',
          url: 'test.com',
          likes: 4,
        })
        cy.createBlog({
          title: 'another blog cypress 2',
          author: 'cypress',
          url: 'test.com',
          likes: 7,
        })
        cy.createBlog({
          title: 'another blog cypress 3',
          author: 'cypress',
          url: 'test.com',
          likes: 2,
        })
      })

      it('blogs are sorted in descending order of likes', function () {
        cy.get('.blogStyle').then(($elements) => {
          const strings = [...$elements].map((el) => el.innerText)
          expect(strings).to.deep.equal([
            'another blog cypress 2 cypress view',
            'another blog cypress 1 cypress view',
            'another blog cypress 3 cypress view',
          ])
        })
      })
    })
  })
})

export default {
    components: true,

    buildModules: [
        '@nuxtjs/tailwindcss'
    ],

    // plugins: [
    //     '~/plugins/three'
    // ],

    build: {
        transpile: [/^three/]
    }


}
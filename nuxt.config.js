export default {
    components: true,

    buildModules: [
        '@nuxtjs/tailwindcss'
    ],

    plugins: [
        '~/plugins/drop'
    ],

    build: {
        transpile: [/^three/]
    }


}